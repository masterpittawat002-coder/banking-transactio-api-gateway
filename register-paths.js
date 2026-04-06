// Register path aliases สำหรับตอน run production (node dist/app.js)
// tsconfig-paths/register ใช้กับ ts-node ตอน dev
// แต่ตอน compile แล้ว เป็น .js → ต้องใช้ตัวนี้แทน

const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

// อ่าน paths จาก tsconfig.json แล้ว map ใหม่ให้ชี้ไปที่ dist/
tsConfigPaths.register({
    baseUrl: path.resolve(__dirname, 'dist'),
    paths: {
        '@/*': ['*'],
        '@config/*': ['config/*'],
        '@services/*': ['services/*'],
        '@controllers/*': ['controllers/*'],
        '@middlewares/*': ['middlewares/*'],
        '@repositories/*': ['repositories/*'],
        '@utils/*': ['utils/*'],
        '@validators/*': ['validators/*'],
        '@types/*': ['types/*'],
    },
});
