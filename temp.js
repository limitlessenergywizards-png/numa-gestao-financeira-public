const finalPromptForAI = JSON.stringify(n8nPromptJSON, null, 2);

const WORKFLOW_ID = 'liR70xSplLvjnj5j';
const HOST = 'n8n-n8n.ckcaua.easypanel.host';
const https = require('https');
const env = fs.readFileSync('.env', 'utf8');
const apiKey = env.match(/^N8N_API_KEY=\"([^\"]+)\"$/m)[1];

const options = {
    hostname: HOST,
    path: '/api/v1/workflows/' + WORKFLOW_ID,
    method: 'GET',
    headers: { 'X-N8N-API-KEY': apiKey }
};

https.get(options, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        const workflow = JSON.parse(body);
        const agentNode = workflow.nodes.find(n => n.type === '@n8n/n8n-nodes-langchain.agent');

        if (!agentNode.parameters.options) agentNode.parameters.options = {};

        // Set the deeply detailed JSON prompt into the N8N text area
        agentNode.parameters.options.systemMessage = "Abaixo está o seu dicionário de base, perfil e restrições. Aja 100% de acordo com as chaves e valores deste Objeto JSON global:\\n\\n" + finalPromptForAI;

const finalPrompt = 'Abaixo está o seu dicionário de base, perfil e restrições. Aja 100% de acordo com as chaves e valores deste Objeto JSON global:\n\n' + finalPromptForAI;
fs.writeFileSync('prompt_numa_atualizado.txt', finalPrompt);
