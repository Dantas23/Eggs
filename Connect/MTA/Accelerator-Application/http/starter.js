/**
 * Configurations env
 */
const dotenv = require("dotenv");
const yargs = require('yargs');
const fs = require('fs');
const HttpServer = require("./HttpAccelerator");
const { inject, download } = require("./utils");
const local = require('../package.json');

dotenv.config();

const argv = yargs
    .option('express', {
        alias: 'e',
        describe: 'Porta usada no acelerador',
        type: 'number',
    })
    .argv
if (argv.express) process.env.EXPRESS_PORT = argv.express.toString(); // Configura porta
// env presets
if (!process.env.LOGS_LEVEL) process.env.LOGS_LEVEL = 2
let NOClient = true
if (process.env.HTTPCLIENTNOCLIENTCACHE) NOClient = Boolean(process.env.HTTPCLIENTNOCLIENTCACHE) === true ? true : false
// preset ip
async function UpdateAcc() {
    try {
        await download("https://github.com/Dantas23/Eggs/raw/main/Connect/MTA/Accelerator-Application/build/mta-accelerator", "mta-accelerator-update")
        console.log('Atualização baixada com sucesso, reinicie para istalar ela.');
    } catch (error) {
        console.error('Erro ao atualizar o arquivo:', error);
    }
}

async function Version() {
    try {
        //verifica se a versão do acelerador é a atual
        const response = await fetch('https://raw.githubusercontent.com/Dantas23/Eggs/main/Connect/MTA/Accelerator-Application/package.json');
        const server = await response.json();

        // const local = process.env.npm_package_version;
        if (local.version === server.version) {
            console.log(`O acelerador está atualizado. v.${local.version}`);
        } else {
            console.log(`O acelerador está desatualizado (${local.version} < ${server.version}), baixando nova atualização ${server.version}`);
            await UpdateAcc();
        }
    } catch (e) {
        // ignores
    }
}
async function getIP() {
    await Version()

    if (process.env.EXPRESS_PORT) {
        if (process.env.LOGS_LEVEL >= 2) console.log('Iniciando com o acelerador.');

        try {
            const response = await fetch('https://ifconfig.me/ip');
            const ipAddress = (await response.text()).trim();
            if (process.env.LOGS_LEVEL >= 2) console.log('Endereço de IP setado:', ipAddress);
            process.env.EXPRESS_HOST = ipAddress
        } catch (error) {
            console.error('Erro ao obter o endereço IP público:', error.message);
        }
        if (process.env.LOGS_LEVEL >= 2) console.log('Configurando iniciador.');
        await inject(/<httpdownloadurl>(.*?)<\/httpdownloadurl>/g, `<httpdownloadurl>http://${process.env.EXPRESS_HOST}:${process.env.EXPRESS_PORT}</httpdownloadurl>`)
        if (process.env.LOGS_LEVEL >= 2) console.log('<httpdownloadurl> Injetado com sucesso.');
    } else {
        if (process.env.LOGS_LEVEL >= 2) console.log('Iniciando sem o acelerador.');
        await inject(/<httpdownloadurl>(.*?)<\/httpdownloadurl>/g, `<httpdownloadurl></httpdownloadurl>`)
        if (process.env.LOGS_LEVEL >= 2) console.log('<httpdownloadurl> alterado com sucesso.');
    }
}
getIP().then(async () => {
    // env-exemple gen
    if (!fs.existsSync(".env") && !fs.existsSync(".env-example")) {
        // Cria o arquivo .env com valores padrão
        const defaultEnvContent = `\
# Logs level is 0-(not show logs(fatal errors is show)) 1-(errors logs) 2-(span logs) 3-(Debug logs) default is 2
LOGS_LEVEL=2
# This is handled by the server in WebResources, but it can also be handled by the accelerator, by default is true
HTTPCLIENTNOCLIENTCACHE=true`;

        fs.writeFileSync(".env-example", defaultEnvContent);
    }
    if (process.env.EXPRESS_PORT) {
        // Start program Express
        const server = new HttpServer(NOClient)
        server.start(process.env.EXPRESS_PORT)
    }
})