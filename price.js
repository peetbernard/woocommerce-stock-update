const fetch = require("node-fetch")
require('dotenv').config()

async function getWebshopSingleAndVari() {
  console.log("START getting simples and variables from webshop at " + new Date())

    const myHeaders = new fetch.Headers();
      myHeaders.append("Authorization", `Basic ${process.env.WC_AUTH}`)
    const response = await fetch(`${process.env.WOO_URL}?per_page=10000`, {method: 'GET', headers: myHeaders, redirect: 'follow'})
    const nyersWoo = await response.text()
    const adatWoo = JSON.parse(nyersWoo)
      const singleArr = []
      const variArr = []
            adatWoo.map((i) => {
              if (i.type === 'simple') {
                singleArr.push({
                  wooId: i.id,
                  cikkSz: i.sku,
                  brutto: Number(i.regular_price),
                  type: 'simple'
                })
                } 
              else {
                  variArr.push(i.id)
                }
              }
            )

  console.log("END getting simples and variables from webshop at " + new Date())
    
    return {variArr, singleArr}
}

async function getWebshopVars() {
  console.log("START getting variations from webshop at " + new Date())

    const kezdet = await getWebshopSingleAndVari()
    const variables = kezdet.variArr
    const all = kezdet.singleArr
    
    const myHeaders = new fetch.Headers();
      myHeaders.append("Authorization", `Basic ${process.env.WC_AUTH}`)
    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'}

        for (let i in variables) {
          const response = await fetch(`${process.env.WOO_URL}${variables[i]}/variations?per_page=100`, requestOptions)
            const stringWoo = await response.text()
            const adatWoo = JSON.parse(stringWoo)
            for (let j in adatWoo){
              all.push({
              parentWooId: variables[i],
              wooId: adatWoo[j].id,
              cikkSz: adatWoo[j].sku,
              brutto: Number(adatWoo[j].regular_price),
              type: 'variation'
            })}
        }

  console.log("END getting variations from webshop at " + new Date())
 
    return all
}

async function pricePosting() {

  console.log("INITIALIZING stock posting at " + new Date())

    const woo = await getWebshopVars()
    const laurel = await functions.getLaurel(`${process.env.PRICE_API_URL}`)
    const myHeaders = new fetch.Headers();
    myHeaders.append("Authorization", `Basic ${process.env.WC_AUTH}`)

    for (let i in woo) {
      for (let j in laurel) {
        if(woo[i].cikkSz === laurel[j].cikkSz && woo[i].brutto !== laurel[j].brutto) {
          if(woo[i].type === "simple") {
            await fetch(`${process.env.WOO_URL}${woo[i].wooId}?regular_price=${laurel[j].brutto}`, {method: 'PUT', headers: myHeaders, redirect: 'follow'})
            console.log("simple " + woo[i].cikkSz + " price " + laurel[j].brutto + " updated")
          }
          else {
            await fetch(`${process.env.WOO_URL}${woo[i].parentWooId}/variations/${woo[i].wooId}?regular_price=${laurel[j].brutto}`, {method: 'PUT', headers: myHeaders, redirect: 'follow'})
            console.log("variation " + woo[i].cikkSz + " price " + laurel[j].brutto + " updated")
          }
        }
      }
    }

  console.log("FINISHED price posting at " + new Date())
}

module.exports = { pricePosting }