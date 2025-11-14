
export const searchStudents = q => Promise.resolve([{id:1, name:'Ana'}]);
export const searchBooks     = q => Promise.resolve([{id:1, title:'React 101'}]);
export const createReq = body => Promise.resolve({ok:true});
export const listReqs  = () => Promise.resolve([]);

export async function listReqs() {
  const { data, error } = await supabase
    .from('requisitions')          // table name in Supabase
    .select(`
      id,
      expected_return,
      status,
      students!inner(name),
      books!inner(title)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}