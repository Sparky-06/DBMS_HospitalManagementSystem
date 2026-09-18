import client from './client';
export const getTestReports = () => client.get('/test-reports');
export const getPatientTestReports = (pId) => client.get(`/patients/${pId}/test-reports`);
export const createTestReport = (pId, data) => client.post(`/patients/${pId}/test-reports`, data);
export const updateTestReport = (pId, testId, data) => client.put(`/patients/${pId}/test-reports/${testId}`, data);
export const deleteTestReport = (pId, testId) => client.delete(`/patients/${pId}/test-reports/${testId}`);
