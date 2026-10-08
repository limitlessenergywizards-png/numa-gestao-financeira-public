import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const envContent = fs.readFileSync('.env', 'utf-8')
let supabaseUrl = ''
let supabaseServiceKey = ''

envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].replace(/"/g, '')
    if (line.startsWith('SUPABASE_SERVICE_ROLE_SECRET=')) supabaseServiceKey = line.split('=')[1].replace(/"/g, '')
})

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkData() {
    console.log("Fetching DB with Service Role...")
    const { data: txs } = await supabase
        .from('transactions')
        .select('id, amount, description, type, nature, forecast_basis, transaction_date')
        .in('amount', [2000, 4000, 6000, 8000, 10000])

    console.log("--- TRANSACTIONS WITH SUSPECT AMOUNTS ---")
    console.log(JSON.stringify(txs, null, 2))

    const { data: recs } = await supabase
        .from('receivables')
        .select('id, description, total_amount, paid_amount, status, due_date')
        .in('total_amount', [2000, 4000, 6000, 8000, 10000])

    console.log("\n--- RECEIVABLES WITH SUSPECT AMOUNTS ---")
    console.log(JSON.stringify(recs, null, 2))

    const { data: payments } = await supabase
        .from('payment_records')
        .select('id, amount, payment_date, receivable_id')

    console.log("\n--- PAYMENT RECORDS ---")
    console.log(JSON.stringify(payments, null, 2))
}

checkData()
