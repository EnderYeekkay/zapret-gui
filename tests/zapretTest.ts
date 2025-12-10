import Zapret from "../modules/Zapret.js"

export async function zapretTest(zapret: Zapret, iterations = 20) {
  let startTime = Date.now()
  for (let i = 0; i < iterations; i++) {
    console.log(`======================= {Iteration: ${i+1}} =======================`)
    let n = getRandomInt(6)
    if (n == 0) await zapret.getAllStrategies()
    if (n == 1) await zapret.checkStatus()
    if (n == 2) await zapret.getData()
    if (n == 3) await zapret.install(7)
    if (n == 4) await zapret.remove()
    if (n == 5) await zapret.switchGameFilter()
  }
  console.log(`======================= {Test Passed (${Math.round((Date.now() - startTime)/1000)}s)} =======================`)
}
function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}