const fs = require('graceful-fs').promises
const { dialog } = require('electron').remote

// Elements
const titleInp = document.getElementById('title')
const loadState = document.getElementById('loadedLut')
const prevImg = document.getElementById('previewImage')
const generateBtn = document.getElementById('generateBtn')
const openBtn = document.getElementById('openBtn')
const convertBtn = document.getElementById('convertBtn')

// Listeners
generateBtn.addEventListener('click', handleGenerate, false)
openBtn.addEventListener('click', handleOpen, false)
convertBtn.addEventListener('click', handleConvert, false)
titleInp.addEventListener('keyup', handleInput, false)

// Canvas
const canvas = document.createElement('canvas')
canvas.width = 512
canvas.height = 512
// document.body.appendChild(canvas) // temp
const ctx = canvas.getContext('2d')

// State Handling
const state = {
    title: '',
    loaded: false,
    filePath: '',
    setState: function(target, value) {
        this[target] = value
        stateChange(target, value)
    }
}

function stateChange(target, value) {
    console.log(`State of ${target} has changed to ${value}`)

    switch (target) {
        case 'loaded':
            if (value === true) {
                prevImg.classList.add('isLoaded')
                prevImg.src = state.filePath
            } else {
                prevImg.classList.remove('isLoaded')
                prevImg.src = ''
            }
            break;
    
        default:
            break;
    }
}

function handleInput(e) {
    // title = e.target.value
    state.setState('title', e.target.value)
}

function setLoadState(state, path) {
    loaded = state
    filePath = path

    if (state === true) {
        loadState.innerText = path
    } else {
        loadState.innerText = ''
    }
}

async function handleOpen() {
    // Disable convert btn while loading new HALD
    convertBtn.disabled = true

    const { filePaths } = await dialog.showOpenDialog({
        buttonLabel: 'Open HALD',
        filters: [
            { name: 'Images', extensions: ['jpg', 'png'] }
        ],
    })

    const img = new Image()
    img.src = filePaths[0]

    img.onload = () => {
        ctx.drawImage(img, 0, 0)
        // allow convert only after image has loaded
        convertBtn.disabled = false

        state.setState('filePath', filePaths[0])
        state.setState('loaded', true)
    }
}

async function handleConvert() {
    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save LUT',
        defaultPath: `slug.cube`,
        filters: [
            { name: '3D LUT (.cube)', extensions: ['cube'] }
        ],
    })

    const data = processCanvas()

    try {
        await fs.writeFile(filePath, data)
        setLoadState(false, '')
        console.log(`✅ LUT Succesfully saved to ${filePath}`)
    } catch (err) {
        console.error(`⚠ The LUT could not be saved to ${filePath}`)
        return
    }
}

function processCanvas() {
    let out = ''

    let y = 0
    while(y < 512) {
        let x = 0
        while(x < 512) {
            const pixelData = ctx.getImageData(x, y, 1, 1).data
            const R = (pixelData[0] / 255).toFixed(6)
            const G = (pixelData[1] / 255).toFixed(6)
            const B = (pixelData[2] / 255).toFixed(6)
    
            out += `${R} ${G} ${B}\n`
    
            x++
        }
        y++
    }

    // Header
    let header =
    `#Created by: VF LUT Generator
    #Copyright: (C) Copyright 2020 © Viktor Fejes
    #Website: https://viktorfejes.com
    TITLE "${state.title}"

    #LUT size
    LUT_3D_SIZE 64

    #data domain
    DOMAIN_MIN 0.0 0.0 0.0
    DOMAIN_MAX 1.0 1.0 1.0

    #LUT data points
    `

    out = header + out
    return out
}

async function createNeutralHald() {
    const imageData = ctx.createImageData(512, 512)

    let i = 0
    let b = 0
    while (b < 64) {
        let g = 0
        while (g < 64) {
            let r = 0
            while (r < 64) {
        
                imageData.data[i] = Math.round(r * (255 / 63))
                imageData.data[i + 1] = Math.round(g * (255 / 63))
                imageData.data[i + 2] = Math.round(b * (255 / 63))
                imageData.data[i + 3] = 255
        
                r++
                i = i + 4
            }
            g++
        }
        b++
    }

    ctx.putImageData(imageData, 0, 0)
    const blob = await new Promise ((res) => canvas.toBlob(blob => res(blob), 'image/jpg', 1))
    return Buffer.from(await blob.arrayBuffer())
}

async function handleGenerate() {
    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save HALD',
        defaultPath: `NeutralHald_64`,
        filters: [
            { name: 'jpeg', extensions: ['jpg'] }
        ],
    })

    const buffer = await createNeutralHald()

    try {
        await fs.writeFile(filePath, buffer)
        console.log(`✅ HALD Succesfully saved to ${filePath}`)
    } catch (err) {
        console.error(`⚠ The HALD could not be saved to ${filePath}`)
        return
    }
}