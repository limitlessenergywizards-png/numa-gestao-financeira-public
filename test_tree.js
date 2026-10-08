const fs = require('fs');

async function test() {
  const response = await fetch(process.env.VITE_SUPABASE_URL + "/rest/v1/chart_of_accounts?select=id,name,parent_id,is_active,type,code,company_id&company_id=eq.c4e27efd-e6b8-4244-98da-fc046bb29374", {
    headers: {
      "apikey": process.env.SUPABASE_SERVICE_ROLE_SECRET,
      "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_ROLE_SECRET
    }
  });
  const accounts = await response.json();
  
  if (accounts.error) {
    console.error("API Error:", accounts.error);
    return;
  }
  
  console.log(`Total accounts fetched: ${accounts.length}`);
  
  const map = new Map();
  const roots = [];

  accounts.forEach((account) => {
    map.set(account.id, { ...account, children: [], level: 0 });
  });

  accounts.forEach((account) => {
    const node = map.get(account.id);
    if (account.parent_id && map.has(account.parent_id)) {
      const parent = map.get(account.parent_id);
      node.level = parent.level + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => a.code.localeCompare(b.code));
    nodes.forEach((node) => sortNodes(node.children));
  };
  
  try {
    sortNodes(roots);
    console.log(`Roots count: ${roots.length}`);
  } catch (e) {
    console.log(`Error sorting: ${e.message}`);
  }
}

test();
