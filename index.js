const execa = require('execa')

async function run() {
  const result = await execa('xrandr')

  const monitors = result.stdout
    .split('\n')
    .filter(x => !x.startsWith(' '))
    .filter(x => x.includes(' connected '))
    .map(x => {
      const isPrimary = x.includes(' primary ')

      const [name, status, pixels, xSize, , ySize] = x
        .replace(' primary ', ' ')
        .replace(/\s\(.*\)\s/, ' ')
        .split(' ')

      const [xPixel, yPixel, xPosition, yPosition] = pixels.split(/[x+]/)

      return {
        name,
        isPrimary,
        status,
        xPixel,
        yPixel,
        xPosition,
        yPosition,
        xSize: xSize.slice(0, -2),
        ySize: ySize.slice(0, -2)
      }
    })

  const primary = monitors.find(x => x.isPrimary)

  const desiredPixelPerMm = primary.yPixel / primary.ySize

  const orderedMonitor = monitors
    .sort((a, b) => a.xPosition - b.xPosition)

  const args = []
  let currentOffset = 0

  orderedMonitor.forEach(monitor => {
    let desiredXPixel = Math.round(monitor.xSize * desiredPixelPerMm)
    let desiredYPixel = Math.round(monitor.ySize * desiredPixelPerMm)

    args.push(
      '--output',
      monitor.name,
      '--pos',
      `${currentOffset}x0`
    )

    if (!monitor.isPrimary) {
      args.push(
        '--scale-from',
        `${desiredXPixel}x${desiredYPixel}`
      )
    }

    currentOffset += desiredXPixel
  })

  console.log(`xrandr ${args.join(' ')}`)
}

run().catch(err => {
  console.log(err)
})