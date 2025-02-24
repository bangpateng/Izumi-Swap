const { ethers } = require('ethers');
const readline = require('readline');
const fs = require('fs');

const RPC_URL = "https://testnet-rpc.monad.xyz/";

let privateKeys = [];
if (fs.existsSync('private_keys.json')) {
    const keyData = JSON.parse(fs.readFileSync('private_keys.json'));
    privateKeys = keyData.keys;
}

const provider = new ethers.JsonRpcProvider(RPC_URL);

const WMON_CONTRACT_ADDRESS = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";

const WMON_ABI = [
    "function deposit() public payable",
    "function withdraw(uint256 wad) public"
];

// 🔹 Fungsi untuk input dari terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function wrapMON(wallet, amount) {
    try {
        const wmonContract = new ethers.Contract(WMON_CONTRACT_ADDRESS, WMON_ABI, wallet);
        const amountIn = ethers.parseUnits(amount.toString(), 18);

        console.log(`⏳ Wallet ${wallet.address}: Mengubah ${amount} MON ke WMON...`);
        const tx = await wmonContract.deposit({ value: amountIn });
        console.log(`✅ Wallet ${wallet.address}: Wrap berhasil! Tx:`, tx.hash);

        await tx.wait();
        console.log(`🎉 Wallet ${wallet.address}: WMON bertambah!`);
    } catch (error) {
        console.error(`❌ Wallet ${wallet.address}: Wrap gagal`, error);
    }
}

async function unwrapWMON(wallet, amount) {
    try {
        const wmonContract = new ethers.Contract(WMON_CONTRACT_ADDRESS, WMON_ABI, wallet);
        const amountIn = ethers.parseUnits(amount.toString(), 18);

        console.log(`⏳ Wallet ${wallet.address}: Mengubah ${amount} WMON ke MON...`);
        const tx = await wmonContract.withdraw(amountIn);
        console.log(`✅ Wallet ${wallet.address}: Unwrap berhasil! Tx:`, tx.hash);

        await tx.wait();
        console.log(`🎉 Wallet ${wallet.address}: MON bertambah!`);
    } catch (error) {
        console.error(`❌ Wallet ${wallet.address}: Unwrap gagal`, error);
    }
}

async function autoSwap(repeatCount, amount) {
    for (let i = 1; i <= repeatCount; i++) {
        console.log(`\n🔄 **Loop ${i} dari ${repeatCount}** 🔄`);

        for (let key of privateKeys) {
            const wallet = new ethers.Wallet(key, provider);

            await wrapMON(wallet, amount);
            await unwrapWMON(wallet, amount);

            console.log(`✅ **Loop ${i} selesai untuk wallet ${wallet.address}**`);
        }
    }
    
    console.log("\n🎉 **Semua transaksi selesai untuk semua wallet!**");
}

async function main() {
    if (privateKeys.length === 0) {
        console.log("❌ Tidak ada private key ditemukan! Pastikan Anda sudah mengisi `private_keys.json`.");
        return;
    }

    console.log(`🟢 Menggunakan ${privateKeys.length} wallet untuk swap`);

    rl.question("🔹 Masukkan jumlah transaksi bolak-balik: ", (repeatCount) => {
        rl.question("🔹 Masukkan jumlah token per transaksi: ", async (amount) => {
            repeatCount = parseInt(repeatCount);
            amount = parseFloat(amount);

            if (!repeatCount || repeatCount <= 0 || !amount || amount <= 0) {
                console.log("❌ Masukkan angka yang valid!");
                rl.close();
                return;
            }

            console.log(`\n🚀 Menjalankan ${repeatCount} transaksi bolak-balik dengan ${amount} MON per transaksi untuk semua wallet...`);
            await autoSwap(repeatCount, amount);

            rl.close();
        });
    });
}

main();
