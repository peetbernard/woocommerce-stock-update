const fetch = require("node-fetch")
let today = new Date(Date.now())
require('dotenv').config()

const dataTable = []

async function getLaurel() {
  today = new Date(Date.now())
  console.log("getting data from laurel started at " + today.toLocaleString())

    const myHeaders = new fetch.Headers()
      myHeaders.append("Authorization", `Basic ${process.env.LAUREL_AUTH}`)
    const response = await fetch(`${process.env.STOCK_API_URL}`, {method: 'GET', headers: myHeaders, redirect: 'follow'})
    const nyersLaurel = await response.json()
    const adatLaurel = JSON.parse(nyersLaurel)

      const lauObj = 
          adatLaurel.inventory.map(i => ({
            cikksz: i.C_KOD,
            keszlet: i.MENNYISEG,
            raktar: i.RAKTAR
          }))

  return lauObj
}

async function getWebshopSingleAndVari() {
  today = new Date(Date.now())
  console.log("START getting simples and variables from webshop at " + today.toLocaleString())

    const myHeaders = new fetch.Headers();
      myHeaders.append("Authorization", `Basic ${process.env.WC_AUTH}`)
    const response = await fetch(`${process.env.WOO_URL}products?per_page=10000`, {method: 'GET', headers: myHeaders, redirect: 'follow'})
    const nyersWoo = await response.text()
    const adatWoo = JSON.parse(nyersWoo)
      const singleArr = []
      const variArr = []
            adatWoo.map((i) => {
              if (i.type === 'simple' && i.sku !== '1061221PRO' && i.sku !== '1061214PRO') {
                singleArr.push({
                  wooId: i.id,
                  cikkSz: i.sku,
                  keszlet: i.stock_quantity
                })
                } 
              else {
                  variArr.push(i.id)
                }
              }
            )

  today = new Date(Date.now())
  console.log("END getting simples and variables from webshop at " + today.toLocaleString())
    console.log (adatWoo)
    return {variArr, singleArr}
}getWebshopSingleAndVari()

async function getWebshopVars() {
  today = new Date(Date.now())
  console.log("START getting variations from webshop at " + today.toLocaleString())

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
              wooId: adatWoo[j].id,
              cikkSz: adatWoo[j].sku,
              keszlet: adatWoo[j].stock_quantity
            })}
        }

  today = new Date(Date.now())
  console.log("END getting variations from webshop at " + today.toLocaleString())

    return all
}

async function stockPosting() {

  today = new Date(Date.now())
  console.log("INITIALIZING stock posting at " + today.toLocaleString())

    const woo = await getWebshopVars()
    const laurel = await getLaurel()
    const sumLaurel = []
      const check = []

      for (let i in laurel) {
        if(!check.includes(laurel[i].cikksz)) {
          const ossz = laurel
            .filter(termek => termek.cikksz === laurel[i].cikksz)
            .map(i => i.keszlet)
            .reduce((sum,pcs) => sum + pcs)
          sumLaurel.push({cikksz: laurel[i].cikksz, sum: ossz})
          check.push(laurel[i].cikksz)
        }
      }

      const final = []
      const cikkSzamok = []
      for (let i in woo) {
        for (let j in sumLaurel) {
        if(woo[i].cikkSz === sumLaurel[j].cikksz && sumLaurel[j].sum !== woo[i].keszlet) {
          cikkSzamok.push({bauerCikk: woo[i].cikkSz, wooCikk: woo[i].wooId,})
            }
          }
        }

      for(let j in laurel) {
        for (let i in cikkSzamok) {

          if (cikkSzamok[i].bauerCikk === laurel[j].cikksz && laurel[j].raktar === 'A001') {
            final.push({
              laurelCikk: cikkSzamok[i].bauerCikk,
              wooCikk: cikkSzamok[i].wooCikk,
              keszlet: laurel[j].keszlet,
              raktar: '1047'
          })
          }

          else if (cikkSzamok[i].bauerCikk === laurel[j].cikksz && laurel[j].raktar === 'A002') {
            final.push({
              laurelCikk: cikkSzamok[i].bauerCikk,
              wooCikk: cikkSzamok[i].wooCikk,
              keszlet: laurel[j].keszlet,
              raktar: '1049'
            })
          }

          else if (cikkSzamok[i].bauerCikk === laurel[j].cikksz && laurel[j].raktar === 'A003'){
            final.push({
              laurelCikk: cikkSzamok[i].bauerCikk,
              wooCikk: cikkSzamok[i].wooCikk,
              keszlet: laurel[j].keszlet,
              raktar: '1048'
            })
          }

        }
      }

    for(let i in final) {
      
      await fetch(`${process.env.WOO_PLUGIN_URL}&id=${final[i].wooCikk}&stock_value=${final[i].keszlet}&action=set&item=stock&format=default&product_id=${final[i].wooCikk}&location_id=${final[i].raktar}`,
        {method: 'POST', redirect: 'follow'})

      console.log(final[i].laurelCikk + " updated to " + final[i].keszlet + " in " + final[i].raktar)

    }

  today = new Date(Date.now())
  console.log("FINISHED stock posting at " + today.toLocaleString())

}

// stockPosting()