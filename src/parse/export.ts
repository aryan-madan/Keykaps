import * as THREE from 'three'
import { GLTFExporter as GLTF } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { STLExporter as STL } from 'three/examples/jsm/exporters/STLExporter.js'
import { DecalGeometry as Decal } from 'three/examples/jsm/geometries/DecalGeometry.js'
import type { Key, Saved, Shape } from '../store/board'
import { cache } from '../geom/cache'
import { ring } from '../geom/case'
import { profile } from '../geom/profile'
import { place } from '../layout/place'
import { bound } from '../layout/bound'
import { center } from '../layout/center'
import { raise, tilt } from '../layout/tilt'

export type Kind = 'full' | 'case' | string

const gap = 0.08

export function dump(board: Saved): string {
  return JSON.stringify(board, null, 2)
}

function tint(raw: string) {
  const c = new THREE.Color(raw || '#333333')
  if (c.r < 0.6 && c.g < 0.6 && c.b < 0.6) c.multiplyScalar(0.35)
  return c
}

async function font() {
  try {
    const face = await new FontFace('Cherry', 'url(/typeface/cherry.otf)').load()
    document.fonts.add(face)
  } catch { }
}

function load(url: string) {
  return new Promise<THREE.Texture>((res, rej) => {
    new THREE.TextureLoader().load(url, res, undefined, rej)
  })
}

async function metal() {
  const [norm, rough, met, ao] = await Promise.all([
    load('/textures/metal/brushed-metal_normal-ogl.png'),
    load('/textures/metal/brushed-metal_roughness.png'),
    load('/textures/metal/brushed-metal_metallic.png'),
    load('/textures/metal/brushed-metal_ao.png')
  ])
    ;[norm, rough, met, ao].forEach((img) => {
      img.wrapS = THREE.RepeatWrapping
      img.wrapT = THREE.RepeatWrapping
      img.repeat.set(2, 2)
    })
  return { norm, rough, met, ao }
}

function uv2(geom: THREE.BufferGeometry) {
  const attr = geom.attributes.uv
  if (attr) geom.setAttribute('uv2', attr)
  return geom
}

function mark(key: Key, tw: number, td: number) {
  if (!key.legend) return null
  const res = 512
  const canv = document.createElement('canvas')
  canv.width = Math.round(res * tw)
  canv.height = Math.round(res * td)
  const ctx = canv.getContext('2d')
  if (!ctx) return null

  ctx.translate(0, canv.height)
  ctx.scale(1, -1)

  ctx.fillStyle = key.textColor || '#222222'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  let size = Math.round(res * 0.28)
  const pad = Math.round(res * 0.12)
  const max = canv.width - pad * 2
  ctx.font = `${size}px Cherry, sans-serif`

  while (ctx.measureText(key.legend).width > max && size > 20) {
    size -= 4
    ctx.font = `${size}px Cherry, sans-serif`
  }

  ctx.fillText(key.legend, pad, pad)

  const img = new THREE.CanvasTexture(canv)
  img.flipY = false
  img.needsUpdate = true
  return img
}

function cap(key: Key, z: number) {
  const site = place(key)
  const geom = cache(key.w - gap, key.h - gap, key.row)
  const y = site.pos[1] + raise(site.pos[2] - z)
  const prof = profile[key.row] ?? profile[0]
  const tw = Math.max(0.1, (key.w - gap) - (1 - prof.taper))
  const td = Math.max(0.1, (key.h - gap) - (1 - prof.taper))

  const grp = new THREE.Group()
  grp.position.set(site.pos[0], y, site.pos[2])
  grp.rotation.set(prof.rotation, site.rot[0], site.rot[0])

  const mat = new THREE.MeshStandardMaterial({ color: tint(key.color), metalness: 0.05, roughness: 0.65 })
  const head = new THREE.Mesh(geom, mat)

  const img = mark(key, tw, td)
  if (img) {
    const dpos = new THREE.Vector3(0, prof.height - prof.dish * 0.5, 0)
    const drot = new THREE.Euler(-Math.PI / 2 + prof.tilt, 0, 0)
    const dsiz = new THREE.Vector3(tw * 0.9, td * 0.9, 0.6)
    const dgeom = new Decal(head, dpos, drot, dsiz)

    const pos = dgeom.attributes.position
    const norm = dgeom.attributes.normal
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(
        i,
        pos.getX(i) + norm.getX(i) * 0.002,
        pos.getY(i) + norm.getY(i) * 0.002,
        pos.getZ(i) + norm.getZ(i) * 0.002
      )
    }

    const dmat = new THREE.MeshStandardMaterial({
      map: img,
      transparent: true,
      roughness: 0.8,
      metalness: 0.0
    })
    grp.add(new THREE.Mesh(dgeom, dmat))
  }

  grp.add(head)
  return grp
}

function frame(keys: Key[], form: Shape) {
  const box = bound(keys)
  const w = box.maxx - box.minx
  const d = box.maxy - box.miny
  const bw = w + form.pad * 2
  const bd = d + form.pad * 2
  const base = ring(w, d, form.pad, form.inset, form.wall)

  const wall = base.clone()
  const pos = wall.attributes.position
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    if (y < min) min = y
    if (y > max) max = y
  }
  const h = form.height * 0.6
  const ct = Math.cos(tilt)
  const tt = Math.tan(tilt)
  const topy = max + 0.52
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const vz = pos.getZ(i)
    const fac = (max - y) / (max - min || 1)
    const tar = -h / ct + vz * tt
    pos.setY(i, topy - fac * (topy - tar))
  }
  wall.computeVertexNormals()

  const bot = new THREE.PlaneGeometry(bw, bd, 1, 1)
  bot.rotateX(-Math.PI / 2)
  const bpos = bot.attributes.position
  for (let i = 0; i < bpos.count; i++) {
    const vz = bpos.getZ(i)
    bpos.setY(i, -h / ct + vz * tt)
  }
  bot.computeVertexNormals()

  const left = -bw / 2 + form.wall
  const rigt = bw / 2 - form.wall
  const top = -bd / 2 + form.wall
  const down = bd / 2 - form.wall

  const out = new THREE.Shape()
  out.moveTo(left, top)
  out.lineTo(left, down)
  out.lineTo(rigt, down)
  out.lineTo(rigt, top)
  out.closePath()

  const cx = box.minx + w / 2
  const cz = box.miny + d / 2
  const near = 0.25
  const seen = new Set<number>()
  const grps: Key[][] = []

  for (let i = 0; i < keys.length; i++) {
    if (seen.has(i)) continue
    const grp = [keys[i]]
    seen.add(i)
    const q = [keys[i]]
    while (q.length > 0) {
      const cur = q.shift() as Key
      for (let j = 0; j < keys.length; j++) {
        if (seen.has(j)) continue
        const k2 = keys[j]
        const dx = Math.max(0, Math.max(cur.x, k2.x) - Math.min(cur.x + cur.w, k2.x + k2.w))
        const dy = Math.max(0, Math.max(cur.y, k2.y) - Math.min(cur.y + cur.h, k2.y + k2.h))
        if (dx < near && dy < near) {
          seen.add(j)
          grp.push(k2)
          q.push(k2)
        }
      }
    }
    grps.push(grp)
  }

  grps.forEach((grp) => {
    const xset = new Set<number>()
    const yset = new Set<number>()
    grp.forEach((k) => {
      xset.add(Number(k.x.toFixed(4)))
      xset.add(Number((k.x + k.w).toFixed(4)))
      yset.add(Number(k.y.toFixed(4)))
      yset.add(Number((k.y + k.h).toFixed(4)))
    })
    const xs = Array.from(xset).sort((a, b) => a - b)
    const ys = Array.from(yset).sort((a, b) => a - b)
    const cols = xs.length - 1
    const rows = ys.length - 1
    const grid: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false))
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const mx = (xs[c] + xs[c + 1]) / 2
        const my = (ys[r] + ys[r + 1]) / 2
        grid[r][c] = grp.some((k) => mx >= k.x && mx <= k.x + k.w && my >= k.y && my <= k.y + k.h)
      }
    }

    type Pt = [number, number]
    type Edge = { a: Pt; b: Pt; use?: boolean }
    const edgs: Edge[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!grid[r][c]) continue
        if (r === 0 || !grid[r - 1][c]) edgs.push({ a: [xs[c], ys[r]], b: [xs[c + 1], ys[r]] })
        if (c === cols - 1 || !grid[r][c + 1]) edgs.push({ a: [xs[c + 1], ys[r]], b: [xs[c + 1], ys[r + 1]] })
        if (r === rows - 1 || !grid[r + 1][c]) edgs.push({ a: [xs[c + 1], ys[r + 1]], b: [xs[c], ys[r + 1]] })
        if (c === 0 || !grid[r][c - 1]) edgs.push({ a: [xs[c], ys[r + 1]], b: [xs[c], ys[r]] })
      }
    }
    if (edgs.length === 0) return

    const fst = edgs[0]
    fst.use = true
    const pts: Pt[] = [fst.a, fst.b]
    let cur = fst.b
    while (true) {
      const nxt = edgs.find((e) => !e.use && Math.abs(e.a[0] - cur[0]) < 1e-4 && Math.abs(e.a[1] - cur[1]) < 1e-4)
      if (!nxt) break
      nxt.use = true
      pts.push(nxt.b)
      cur = nxt.b
      if (Math.abs(cur[0] - pts[0][0]) < 1e-4 && Math.abs(cur[1] - pts[0][1]) < 1e-4) break
    }

    const hole = new THREE.Path()
    pts.forEach(([px, py], i) => {
      const hx = px - cx
      const hy = py - cz
      if (i === 0) hole.moveTo(hx, hy)
      else hole.lineTo(hx, hy)
    })
    hole.closePath()
    out.holes.push(hole)
  })

  const deck = new THREE.ExtrudeGeometry(out, { depth: 0.01, bevelEnabled: false, steps: 1 })
  deck.rotateX(Math.PI / 2)
  deck.computeVertexNormals()

  return { wall: uv2(wall), bot: uv2(bot), deck: uv2(deck), topy: topy + 0.001, box }
}

function shell(keys: Key[], kase: string, form: Shape, maps: Awaited<ReturnType<typeof metal>>) {
  const part = frame(keys, form)
  const mat = new THREE.MeshStandardMaterial({
    color: !kase || kase === '#000000' ? '#ffffff' : kase,
    normalMap: maps.norm,
    roughnessMap: maps.rough,
    metalnessMap: maps.met,
    aoMap: maps.ao,
    metalness: 0.9,
    roughness: 0.5,
    side: THREE.DoubleSide
  })

  const grp = new THREE.Group()
  grp.add(new THREE.Mesh(part.wall, mat))
  grp.add(new THREE.Mesh(part.bot, mat))
  const deck = new THREE.Mesh(part.deck, mat)
  deck.position.set(0, part.topy, 0)
  grp.add(deck)

  const x = part.box.minx + (part.box.maxx - part.box.minx) / 2
  const z = part.box.miny + (part.box.maxy - part.box.miny) / 2
  grp.position.set(x, -0.15, z)
  return grp
}

export async function build(board: Saved, kind: Kind) {
  if (board.keys.length === 0) throw new Error('empty board')
  await font()
  const maps = await metal()
  const box = bound(board.keys)
  const mid = center(box)

  const root = new THREE.Group()
  const wrap = new THREE.Group()
  wrap.rotation.x = tilt
  wrap.add(shell(board.keys, board.case, board.shape, maps))
  root.add(wrap)

  if (kind === 'full') {
    board.keys.forEach((k) => root.add(cap(k, mid.z)))
  }

  root.position.set(-mid.x, 0, -mid.z)
  return root
}

export async function glb(board: Saved, kind: Kind): Promise<Blob> {
  const root = await build(board, kind)
  const exp = new GLTF()
  const buf = await new Promise<ArrayBuffer>((res, rej) => {
    exp.parse(root, (out) => res(out as ArrayBuffer), (err) => rej(err), { binary: true })
  })
  return new Blob([buf], { type: 'model/gltf-binary' })
}

export async function stl(board: Saved, kind: Kind): Promise<Blob> {
  const root = await build(board, kind)
  const exp = new STL()
  const buf = exp.parse(root, { binary: true }) as unknown as DataView
  return new Blob([buf.buffer as ArrayBuffer], { type: 'model/stl' })
}