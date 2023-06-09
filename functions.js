const nodemailer = require("nodemailer")
require('dotenv').config()
const fetch = require("node-fetch")

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

async function email(tartalom) {
  
  const info = await transporter.sendMail({
    from: '"Peet 👻" <peter.bernard@marcziskate.hu>', // sender address
    to: "peter.bernard@marcziskate.hu", // list of receivers
    subject: `${tartalom} elfogyott a webshopról`, // Subject line
    text: `${tartalom} elfogyott a webshopról`, // plain text body
    html: `<b>${tartalom} elfogyott a webshopról</b>`, // html body
  });

  console.log("Üzenet elküldve: %s", info.messageId);
}

async function getLaurel(url) {
    console.log("getting data from laurel started at " + new Date())
  
      const myHeaders = new fetch.Headers()
        myHeaders.append("Authorization", `Basic ${process.env.LAUREL_AUTH}`)
      const response = await fetch(url, {method: 'GET', headers: myHeaders, redirect: 'follow'})
      const nyersLaurel = await response.json()
      const adatLaurel = JSON.parse(nyersLaurel)
  
      const price = () => {
        const lauPrice = 
            adatLaurel.prices.map(i => ({
                cikkSz: i.C_KOD,
                brutto: i.BRUTTO,
            }))
        return lauPrice}

        const stock = () => {
        const lauStock = 
        adatLaurel.inventory
        // ez a filter átmeneti, amíg a többi üzlet nem nyílik ki
        .filter(i => i.RAKTAR === 'A001')
        //VÉGE
        .map(i => ({
            cikksz: i.C_KOD,
            keszlet: i.MENNYISEG,
            raktar: i.RAKTAR
        }))
  
        for (let i in lauStock) {
            if (lauStock[i].keszlet < 0) {
            lauStock[i].keszlet = 0
            }
        }
    return lauStock}
  
  return adatLaurel.prices ? price() : stock()
  }

module.exports = { email, getLaurel }