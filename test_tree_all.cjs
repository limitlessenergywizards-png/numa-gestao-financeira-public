const fs = require('fs');

async function checkCycles() {
  const url = process.env.VITE_SUPABASE_URL + "/rest/v1/chart_of_accounts?select=id,name,parent_id,is_active,type,code,company_id";
  const response = await fetch(url, {
    headers: {
      "apikey": process.env.SUPABASE_SERVICE_ROLE_SECRET,
      "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_ROLE_SECRET
    }
  });
  const allAccounts = await response.json();

  if (allAccounts.error) {
    console.error("API Error:", allAccounts.error);
    return;
  }

  const byCompany = {};
  allAccounts.forEach(a => {
    if (!byCompany[a.company_id]) byCompany[a.company_id] = [];
    byCompany[a.company_id].push(a);
  });

  let foundIssue = false;

  for (const [companyId, accounts] of Object.entries(byCompany)) {
    const parentMap = new Map();
    accounts.forEach(a => parentMap.set(a.id, a.parent_id));

    let cycleFound = false;
    for (const [id, parentId] of parentMap.entries()) {
      let current = parentId;
      const seen = new Set([id]);
      while (current) {
        if (seen.has(current)) {
          console.log(`Cycle found in company ${companyId}! Account ${id} -> ... -> ${current}`);
          cycleFound = true;
          foundIssue = true;
          break;
        }
        seen.add(current);
        current = parentMap.get(current);
      }
    }

    // Check if there are NO roots but there are accounts
    const map = new Map();
    const roots = [];
    accounts.forEach((account) => {
      map.set(account.id, { ...account, children: [], level: 0 });
    });
    accounts.forEach((account) => {
      const node = map.get(account.id);
      if (account.parent_id && map.has(account.parent_id)) {
        const parent = map.get(account.parent_id);
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    if (accounts.length > 0 && roots.length === 0) {
      console.log(`Company ${companyId} has ${accounts.length} accounts but NO ROOTS.`);
      foundIssue = true;
    }
  }

  if (!foundIssue) {
    console.log("No circular references or rootless trees found in any company.");
  }
}

checkCycles();
