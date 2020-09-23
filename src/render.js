const fs = require('graceful-fs').promises
const { dialog } = require('electron').remote

// Buttons
const generateBtn = document.getElementById('generateBtn')
const openBtn = document.getElementById('openBtn')
const convertBtn = document.getElementById('convertBtn')

// Listeners
openBtn.addEventListener('click', handleOpen, false)
convertBtn.addEventListener('click', handleConvert, false)

// Canvas
const canvas = document.createElement('canvas')
canvas.width = 512
canvas.height = 512
// document.body.appendChild(canvas)
const ctx = canvas.getContext('2d')

// Header (TEMP?)
const header =
`#Created by: VF LUT Generator
#Copyright: (C) Copyright 2020 © Viktor Fejes
#Website: https://viktorfejes.com
TITLE "Test LUT bla-bla"

#LUT size
LUT_3D_SIZE 64

#data domain
DOMAIN_MIN 0.0 0.0 0.0
DOMAIN_MAX 1.0 1.0 1.0

#LUT data points
`

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

    out = header + out
    return out
}