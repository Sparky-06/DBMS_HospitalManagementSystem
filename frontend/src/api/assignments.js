import client from './client';
export const getAssignments = () => client.get('/assignments');
export const createAssignment = (data) => client.post('/assignments', data);
export const deleteAssignment = (p_id, r_id) => client.delete(`/assignments?p_id=${p_id}&r_id=${r_id}`);
