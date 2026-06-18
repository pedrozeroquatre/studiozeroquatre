// GOOGLE SHEETS HOOK [clients]:
// Replace CLIENTS with a fetch from the clients sheet.
// Use unstable_cache({ revalidate: 300 }) to avoid hitting Sheets API on every request.
// Sheet columns: code, name, email, phone, ...order history in separate sheet.
const CLIENTS = [
  {
    code: 'SZQ-TEST-0001',
    name: 'Volta Supper Club',
    email: 'contact@volta.be',
    orders: [
      {
        date: '2024-10-15',
        ref: 'SZQ-A1B2C3D4',
        items: 'Boîte Pizza M ×200',
        status: 'Livré',
      },
      {
        date: '2024-11-28',
        ref: 'SZQ-E5F6G7H8',
        items: 'Sac Kraft ×500, Boîte Burger ×100',
        status: 'En cours',
      },
    ],
  },
]

export function findClient(code) {
  return CLIENTS.find((c) => c.code === code) ?? null
}
