async function testCalc() {
    try {
        const response = await fetch('http://localhost:3000/api/attendance/calculate', {
            method: 'POST',
            body: JSON.stringify({ startDate: '2026-02-01', endDate: '2026-02-15' })
        });
        const data = await response.json();
        console.log('Bulk Calc:', data);
    } catch (e) { console.error(e); }

    try {
        const response2 = await fetch('http://localhost:3000/api/attendance/calculate', {
            method: 'POST',
            body: JSON.stringify({ date: '2026-02-14' })
        });
        const data2 = await response2.json();
        console.log('Single Calc:', data2);
    } catch (e) { console.error(e); }
}
testCalc();
