const fetch = require("node-fetch")
require('dotenv').config()

async function getLaurel() {
  console.log("getting data from laurel started at " + new Date())

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

    for (let i in lauObj) {
      if (lauObj[i].keszlet < 0) {
        lauObj[i].keszlet = 0
      }
    }

  return lauObj
}

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
              if (i.type === 'simple' && i.sku !== '1061221PRO' && i.sku !== '1061214PRO') {
                singleArr.push({
                  wooId: i.id,
                  cikkSz: i.sku,
                  keszlet: i.stock_quantity,
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
              keszlet: adatWoo[j].stock_quantity,
              type: 'variation'
            })}
        }

  console.log("END getting variations from webshop at " + new Date())
 
    return all
}

async function stockPosting() {

  console.log("INITIALIZING stock posting at " + new Date())

    const woo = await getWebshopVars()
    const laurel = await getLaurel()
    const sumLaurel = []
    const check = []

      for (let i in laurel) {

        if (laurel[i].keszlet < 0) {laurel[i].keszlet = 0}

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
          cikkSzamok.push({bauerCikk: woo[i].cikkSz, wooCikk: woo[i].wooId, type: woo[i].type, parent: woo[i].parentWooId, sum: sumLaurel[j].sum})
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
              raktar: '1047',
              type: cikkSzamok[i].type,
              parent: cikkSzamok[i].parent,
              sum: cikkSzamok[i].sum
          })
          }

          else if (cikkSzamok[i].bauerCikk === laurel[j].cikksz && laurel[j].raktar === 'A002') {
            final.push({
              laurelCikk: cikkSzamok[i].bauerCikk,
              wooCikk: cikkSzamok[i].wooCikk,
              keszlet: laurel[j].keszlet,
              raktar: '1049',
              type: cikkSzamok[i].type,
              parent: cikkSzamok[i].parent,
              sum: cikkSzamok[i].sum
            })
          }

          else if (cikkSzamok[i].bauerCikk === laurel[j].cikksz && laurel[j].raktar === 'A003'){
            final.push({
              laurelCikk: cikkSzamok[i].bauerCikk,
              wooCikk: cikkSzamok[i].wooCikk,
              keszlet: laurel[j].keszlet,
              raktar: '1048',
              type: cikkSzamok[i].type,
              parent: cikkSzamok[i].parent,
              sum: cikkSzamok[i].sum
            })
          }

        }
      }

      for(let i in final) {

        await fetch(`${process.env.WOO_PLUGIN_URL}&id=${final[i].wooCikk}&stock_value=${final[i].keszlet}&action=set&item=stock&format=default&product_id=${final[i].wooCikk}&location_id=${final[i].raktar}`,
          {method: 'POST', redirect: 'follow'})

        console.log(final[i].laurelCikk + " updated to " + final[i].keszlet + " in " + final[i].raktar)
        
      }



      for(let i in final) { 

        const myHeaders = new fetch.Headers();
        myHeaders.append("Authorization", `Basic ${process.env.WC_AUTH}`)

        if (final[i].type === 'simple') {
          await fetch(`${process.env.WOO_URL}${final[i].wooCikk}?stock_quantity=${final[i].sum}`, {method: 'PUT', headers: myHeaders, redirect: 'follow'})
          console.log("simple" + final[i].wooCikk + "total" + final[i].sum + "updated")
        }
        else {
          await fetch(`${process.env.WOO_URL}${final[i].parent}/variations/${final[i].wooCikk}?stock_quantity=${final[i].sum}`, {method: 'PUT', headers: myHeaders, redirect: 'follow'})
          console.log("variation" + final[i].wooCikk + "total" + final[i].sum + "updated")
        }
      }

  console.log("FINISHED stock posting at " + new Date())
}

stockPosting()