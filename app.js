const price = require('./price')
const stock = require('./stock')
var cron = require('node-cron')


cron.schedule('10,30,50 10-19 * * 1,2,3,4,5,6', stock.stockPosting)

cron.schedule('00 23 * * *', price.pricePosting)