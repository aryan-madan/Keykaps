import { useState, useRef, useEffect } from 'react'
import { useBoard, type Key } from '../store/board'
import { row } from '../parse/row'
import { FiPlus, FiTrash2, FiArrowUp, FiArrowDown, FiArrowLeft, FiArrowRight, FiX, FiChevronUp, FiChevronDown } from 'react-icons/fi'

const cats = [
    { id: 'letters', name: 'letters', keys: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') },
    { id: 'numbers', name: 'numbers', keys: '1234567890'.split('') },
    { id: 'mods', name: 'modifiers', keys: ['Ctrl', 'Shift', 'Alt', 'Win', 'Cmd', 'Tab', 'Caps', 'Esc', 'Space', 'Enter', 'Bksp'] },
    { id: 'nav', name: 'navigation', keys: ['Home', 'End', 'PgUp', 'PgDn', 'Ins', 'Del', '↑', '↓', '←', '→'] },
    { id: 'func', name: 'function', keys: Array.from({ length: 12 }, (_, i) => `F${i + 1}`) },
    { id: 'sym', name: 'symbols', keys: ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}', '|', ':', '"', '<', '>', '?'] }
]

export function Layout({ vis, exit }: { vis: boolean; exit: () => void }) {
    const keys = useBoard((state) => state.keys)
    const commit = useBoard((state) => state.commit)
    const schemes = useBoard((state) => state.schemes)
    const scheme = useBoard((state) => state.scheme)

    const [localKeys, setLocalKeys] = useState<Key[]>(keys)
    const [sel, setSel] = useState<string | null>(null)
    const [zoom, setZoom] = useState(40)
    const [pan, setPan] = useState({ x: 100, y: 100 })
    const [cat, setCat] = useState('letters')
    const [dirty, setDirty] = useState(false)

    const isInitialized = useRef(false)
    const isPanning = useRef(false)
    const panStart = useRef({ x: 0, y: 0 })
    const interactionRef = useRef<{
        type: 'drag' | 'resize' | null
        keyId: string | null
        handle: string | null
        startX: number
        startY: number
        initialKeyX: number
        initialKeyY: number
        initialKeyW: number
        initialKeyH: number
    }>({
        type: null,
        keyId: null,
        handle: null,
        startX: 0,
        startY: 0,
        initialKeyX: 0,
        initialKeyY: 0,
        initialKeyW: 1,
        initialKeyH: 1,
    })

    useEffect(() => {
        if (vis && !isInitialized.current) {
            setLocalKeys(keys)
            setDirty(false)
            isInitialized.current = true
        }
        if (!vis) {
            isInitialized.current = false
        }
    }, [vis, keys])

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (!vis) return
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                e.preventDefault()
                if (dirty) {
                    commit(localKeys)
                    setDirty(false)
                }
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [vis, dirty, localKeys, commit])

    const handleClose = () => {
        exit()
    }

    const handleSave = () => {
        commit(localKeys)
        setDirty(false)
    }

    function addkey() {
        const prev = localKeys[localKeys.length - 1]
        const newY = prev ? prev.y : 0
        const item: Key = {
            id: Math.random().toString(36).substring(2, 9),
            x: prev ? prev.x + prev.w : 0,
            y: newY,
            w: 1,
            h: 1,
            r: 0,
            rx: 0,
            ry: 0,
            x2: 0,
            y2: 0,
            w2: 1,
            h2: 1,
            row: row(newY),
            legend: '',
            color: 'base',
            textColor: ''
        }
        const updated = [...localKeys, item]
        setLocalKeys(updated)
        setDirty(true)
        setSel(item.id)
    }

    function delkey() {
        if (!sel) return
        const updated = localKeys.filter((k) => k.id !== sel)
        setLocalKeys(updated)
        setDirty(true)
        setSel(null)
    }

    function move(dx: number, dy: number) {
        if (!sel) return
        const updated = localKeys.map((k) => {
            if (k.id === sel) {
                const newY = Math.round((k.y + dy) * 4) / 4
                const newX = Math.round((k.x + dx) * 4) / 4
                return { ...k, x: newX, y: newY, row: row(newY) }
            }
            return k
        })
        setLocalKeys(updated)
        setDirty(true)
    }

    function update(field: keyof Key, val: any) {
        if (!sel) return
        const updated = localKeys.map((k) => {
            if (k.id === sel) {
                const updatedKey = { ...k, [field]: val }
                if (field === 'y') {
                    updatedKey.row = row(Number(val) || 0)
                }
                return updatedKey
            }
            return k
        })
        setLocalKeys(updated)
        setDirty(true)
    }

    function stepValue(field: keyof Key, amount: number, min: number = 0) {
        if (!curkey) return
        const currentVal = Number(curkey[field]) || 0
        const newVal = Math.max(min, Math.round((currentVal + amount) * 4) / 4)
        update(field, newVal)
    }

    const handleMouseDownCanvas = (e: React.MouseEvent) => {
        if (e.button === 0 && (e.target as HTMLElement).dataset.canvas === 'true') {
            isPanning.current = true
            panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
            setSel(null)
        }
    }

    const handleMouseDownKey = (e: React.MouseEvent, k: Key) => {
        if (e.button !== 0) return
        e.stopPropagation()
        setSel(k.id)
        isPanning.current = false
        interactionRef.current = {
            type: 'drag',
            keyId: k.id,
            handle: null,
            startX: e.clientX,
            startY: e.clientY,
            initialKeyX: k.x,
            initialKeyY: k.y,
            initialKeyW: k.w,
            initialKeyH: k.h,
        }
    }

    const handleMouseDownResize = (e: React.MouseEvent, k: Key, handle: string) => {
        if (e.button !== 0) return
        e.stopPropagation()
        setSel(k.id)
        isPanning.current = false
        interactionRef.current = {
            type: 'resize',
            keyId: k.id,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            initialKeyX: k.x,
            initialKeyY: k.y,
            initialKeyW: k.w,
            initialKeyH: k.h,
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning.current) {
            setPan({
                x: e.clientX - panStart.current.x,
                y: e.clientY - panStart.current.y,
            })
            return
        }

        const { type, keyId, handle, startX, startY, initialKeyX, initialKeyY, initialKeyW, initialKeyH } = interactionRef.current
        if (!type || !keyId) return

        const scale = zoom * 1.2
        const dx = (e.clientX - startX) / scale
        const dy = (e.clientY - startY) / scale

        setLocalKeys((prevKeys) =>
            prevKeys.map((k) => {
                if (k.id !== keyId) return k

                if (type === 'drag') {
                    const newX = Math.round((initialKeyX + dx) * 4) / 4
                    const newY = Math.round((initialKeyY + dy) * 4) / 4
                    return { ...k, x: newX, y: newY, row: row(newY) }
                }

                if (type === 'resize' && handle) {
                    let newX = initialKeyX
                    let newY = initialKeyY
                    let newW = initialKeyW
                    let newH = initialKeyH

                    if (handle.includes('r')) {
                        newW = Math.max(0.25, Math.round((initialKeyW + dx) * 4) / 4)
                    }
                    if (handle.includes('b')) {
                        newH = Math.max(0.25, Math.round((initialKeyH + dy) * 4) / 4)
                    }
                    if (handle.includes('l')) {
                        const rawW = initialKeyW - dx
                        const clampedW = Math.max(0.25, Math.round(rawW * 4) / 4)
                        const actualDx = initialKeyW - clampedW
                        newW = clampedW
                        newX = Math.round((initialKeyX + actualDx) * 4) / 4
                    }
                    if (handle.includes('t')) {
                        const rawH = initialKeyH - dy
                        const clampedH = Math.max(0.25, Math.round(rawH * 4) / 4)
                        const actualDy = initialKeyH - clampedH
                        newH = clampedH
                        newY = Math.round((initialKeyY + actualDy) * 4) / 4
                    }

                    return { ...k, x: newX, y: newY, w: newW, h: newH, row: row(newY) }
                }

                return k
            })
        )
        setDirty(true)
    }

    const handleMouseUp = () => {
        isPanning.current = false
        if (interactionRef.current.type) {
            interactionRef.current.type = null
            interactionRef.current.keyId = null
            interactionRef.current.handle = null
        }
    }

    const curkey = localKeys.find((k) => k.id === sel)
    const curcat = cats.find((c) => c.id === cat)
    const curscheme = schemes.find((s) => s.id === scheme)

    return (
        <div
            className={`fixed left-5 top-5 z-50 bg-zinc-950 rounded-2xl shadow-2xl flex flex-col font-sans text-zinc-200 overflow-hidden border border-zinc-800/80 transition-all duration-300 ease-out w-[calc(100vw-40px)] h-[calc(100vh-40px)] ${vis ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
        >
            <div className="flex h-12 items-center justify-between px-4 border-b border-zinc-900 bg-zinc-950">
                <div className="flex items-center gap-2">
                    <span className="font-cherry text-lg text-zinc-100">layout editor</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleClose}
                        className="flex h-7 w-7 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition"
                    >
                        <FiX className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div
                    data-canvas="true"
                    className="flex-1 relative bg-zinc-950 overflow-hidden cursor-grab active:cursor-grabbing select-none"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(63, 63, 70, 0.25) 1px, transparent 1px)`,
                        backgroundSize: `${zoom * 1.2}px ${zoom * 1.2}px`,
                        backgroundPosition: `${pan.x}px ${pan.y}px`
                    }}
                    onWheel={(e) => setZoom((z) => Math.max(20, Math.min(100, z - e.deltaY * 0.05)))}
                    onMouseDown={handleMouseDownCanvas}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px)`,
                        }}
                    >
                        {localKeys.map((k) => {
                            const act = k.id === sel
                            const named = curscheme?.swatches[k.color as keyof typeof curscheme.swatches]
                            const bg = named?.background ?? k.color ?? '#27272a'
                            const fg = k.textColor || named?.color || '#d4d4d8'
                            return (
                                <div
                                    key={k.id}
                                    data-key="true"
                                    onMouseDown={(e) => handleMouseDownKey(e, k)}
                                    style={{
                                        position: 'absolute',
                                        left: `${k.x * zoom * 1.2}px`,
                                        top: `${k.y * zoom * 1.2}px`,
                                        width: `${k.w * zoom * 1.2}px`,
                                        height: `${k.h * zoom * 1.2}px`,
                                        backgroundColor: bg,
                                        color: fg
                                    }}
                                    className={`pointer-events-auto rounded-xl p-2 flex items-center justify-center text-[11px] font-cherry transition-shadow cursor-pointer shadow-md border ${act ? 'ring-2 ring-zinc-100 border-zinc-100 z-10' : 'border-zinc-800 hover:brightness-110'
                                        }`}
                                >
                                    <span className="truncate pointer-events-none">{k.legend || 'key'}</span>
                                    {act && (
                                        <>
                                            <div
                                                onMouseDown={(e) => handleMouseDownResize(e, k, 'tl')}
                                                className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-zinc-100 rounded-full border border-zinc-950 cursor-nwse-resize z-25"
                                            />
                                            <div
                                                onMouseDown={(e) => handleMouseDownResize(e, k, 'tr')}
                                                className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-zinc-100 rounded-full border border-zinc-950 cursor-nesw-resize z-25"
                                            />
                                            <div
                                                onMouseDown={(e) => handleMouseDownResize(e, k, 'bl')}
                                                className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-zinc-100 rounded-full border border-zinc-950 cursor-nesw-resize z-25"
                                            />
                                            <div
                                                onMouseDown={(e) => handleMouseDownResize(e, k, 'br')}
                                                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-zinc-100 rounded-full border border-zinc-950 cursor-nwse-resize z-25"
                                            />
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 pointer-events-auto">
                        <button
                            onClick={addkey}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] font-medium transition"
                        >
                            <FiPlus className="h-3.5 w-3.5" />
                            <span>add key</span>
                        </button>
                        <button
                            onClick={delkey}
                            disabled={!sel}
                            className="flex items-center justify-center h-7 w-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 disabled:opacity-40 transition"
                        >
                            <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="absolute bottom-14 left-0 right-0 flex justify-center pointer-events-none">
                        <div className={`transition-all duration-200 ${dirty ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                            <button
                                onClick={handleSave}
                                className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-[10px] text-zinc-300 hover:text-zinc-100 font-medium transition-all shadow-lg"
                            >
                                <span>unsaved changes</span>
                                <kbd className="inline-flex items-center gap-0.5 text-[9px] font-sans text-zinc-400">
                                    <span>⌘</span>S
                                </kbd>
                            </button>
                        </div>
                    </div>

                </div>

                <div className="w-80 bg-zinc-950 border-l border-zinc-900 p-4 flex flex-col space-y-3 overflow-y-auto">
                    <label className="text-[9px] font-medium text-zinc-500 px-1">key properties</label>
                    {curkey ? (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-medium text-zinc-500 px-1">legend</label>
                                <input
                                    type="text"
                                    value={curkey.legend || ''}
                                    onChange={(e) => update('legend', e.target.value)}
                                    className="h-8 w-full bg-zinc-900 text-zinc-100 rounded-xl px-3 text-[11px] outline-none focus:bg-zinc-800"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-medium text-zinc-500 px-1">key color</label>
                                <div className="space-y-1.5">
                                    <input
                                        type="text"
                                        placeholder="e.g. #27272a or base"
                                        value={curkey.color || ''}
                                        onChange={(e) => update('color', e.target.value)}
                                        className="h-8 w-full bg-zinc-900 text-zinc-100 rounded-xl px-3 text-[11px] outline-none focus:bg-zinc-800"
                                    />
                                    <div className="bg-zinc-900 rounded-xl p-1 space-y-0.5">
                                        {curscheme && Object.entries(curscheme.swatches).map(([name, swatch]) => {
                                            const act = curkey.color === name
                                            return (
                                                <button
                                                    key={name}
                                                    onClick={() => update('color', name)}
                                                    className={`flex h-7 w-full items-center justify-between px-2.5 text-[11px] rounded-lg transition ${act
                                                        ? 'bg-zinc-100 text-zinc-950 font-semibold'
                                                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                                                        }`}
                                                >
                                                    <span className="lowercase">{name}</span>
                                                    <span className="h-3 w-3 rounded-md" style={{ backgroundColor: swatch.background }} />
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-medium text-zinc-500 px-1">text color (fg)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. #ff0000 or inherited"
                                    value={curkey.textColor || ''}
                                    onChange={(e) => update('textColor', e.target.value)}
                                    className="h-8 w-full bg-zinc-900 text-zinc-100 rounded-xl px-3 text-[11px] outline-none focus:bg-zinc-800"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-medium text-zinc-500 px-1">key picker</label>
                                <div className="flex flex-wrap gap-1">
                                    {cats.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setCat(c.id)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition ${cat === c.id
                                                ? 'bg-zinc-100 text-zinc-950'
                                                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                                                }`}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-4 gap-1.5 pt-1 max-h-48 overflow-y-auto no-scrollbar bg-zinc-900 rounded-xl p-1">
                                    {curcat?.keys.map((kVal) => {
                                        const act = curkey.legend === kVal
                                        return (
                                            <button
                                                key={kVal}
                                                onClick={() => update('legend', kVal)}
                                                className={`h-9 rounded-lg flex items-center justify-center font-mono text-[11px] transition ${act
                                                    ? 'bg-zinc-100 text-zinc-950 font-bold'
                                                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                                                    }`}
                                            >
                                                {kVal}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-medium text-zinc-500 px-1">pos x</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="number"
                                            step="0.25"
                                            value={curkey.x}
                                            onChange={(e) => update('x', parseFloat(e.target.value) || 0)}
                                            className="h-8 w-full bg-zinc-900 text-zinc-100 rounded-xl pl-3 pr-8 text-[11px] outline-none focus:bg-zinc-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <div className="absolute right-1 flex flex-col h-6 w-5 justify-between">
                                            <button
                                                onClick={() => stepValue('x', 0.25)}
                                                className="h-2.5 w-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition"
                                            >
                                                <FiChevronUp className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={() => stepValue('x', -0.25)}
                                                className="h-2.5 w-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition"
                                            >
                                                <FiChevronDown className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-medium text-zinc-500 px-1">pos y</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="number"
                                            step="0.25"
                                            value={curkey.y}
                                            onChange={(e) => update('y', parseFloat(e.target.value) || 0)}
                                            className="h-8 w-full bg-zinc-900 text-zinc-100 rounded-xl pl-3 pr-8 text-[11px] outline-none focus:bg-zinc-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <div className="absolute right-1 flex flex-col h-6 w-5 justify-between">
                                            <button
                                                onClick={() => stepValue('y', 0.25)}
                                                className="h-2.5 w-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition"
                                            >
                                                <FiChevronUp className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={() => stepValue('y', -0.25)}
                                                className="h-2.5 w-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition"
                                            >
                                                <FiChevronDown className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-medium text-zinc-500 px-1">width</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="number"
                                            step="0.25"
                                            value={curkey.w}
                                            onChange={(e) => update('w', parseFloat(e.target.value) || 1)}
                                            className="h-8 w-full bg-zinc-900 text-zinc-100 rounded-xl pl-3 pr-8 text-[11px] outline-none focus:bg-zinc-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <div className="absolute right-1 flex flex-col h-6 w-5 justify-between">
                                            <button
                                                onClick={() => stepValue('w', 0.25, 0.25)}
                                                className="h-2.5 w-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition"
                                            >
                                                <FiChevronUp className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={() => stepValue('w', -0.25, 0.25)}
                                                className="h-2.5 w-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition"
                                            >
                                                <FiChevronDown className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-medium text-zinc-500 px-1">height</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="number"
                                            step="0.25"
                                            value={curkey.h}
                                            onChange={(e) => update('h', parseFloat(e.target.value) || 1)}
                                            className="h-8 w-full bg-zinc-900 text-zinc-100 rounded-xl pl-3 pr-8 text-[11px] outline-none focus:bg-zinc-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <div className="absolute right-1 flex flex-col h-6 w-5 justify-between">
                                            <button
                                                onClick={() => stepValue('h', 0.25, 0.25)}
                                                className="h-2.5 w-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition"
                                            >
                                                <FiChevronUp className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={() => stepValue('h', -0.25, 0.25)}
                                                className="h-2.5 w-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition"
                                            >
                                                <FiChevronDown className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                <button onClick={() => move(0, -0.25)} className="h-8 bg-zinc-900 hover:bg-zinc-800 rounded-lg flex items-center justify-center"><FiArrowUp className="h-3.5 w-3.5" /></button>
                                <button onClick={() => move(0, 0.25)} className="h-8 bg-zinc-900 hover:bg-zinc-800 rounded-lg flex items-center justify-center"><FiArrowDown className="h-3.5 w-3.5" /></button>
                                <button onClick={() => move(-0.25, 0)} className="h-8 bg-zinc-900 hover:bg-zinc-800 rounded-lg flex items-center justify-center"><FiArrowLeft className="h-3.5 w-3.5" /></button>
                                <button onClick={() => move(0.25, 0)} className="h-8 bg-zinc-900 hover:bg-zinc-800 rounded-lg flex items-center justify-center"><FiArrowRight className="h-3.5 w-3.5" /></button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-[11px] text-zinc-600 font-mono py-8 text-center">select a key to edit properties</div>
                    )}
                </div>
            </div>
        </div>
    )
}