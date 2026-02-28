const fs = require('fs');
const takeTestPath = 'src/pages/employee/TakeTest.tsx';
const createTestPath = 'src/pages/employer/CreateTest.tsx';

let takeTest = fs.readFileSync(takeTestPath, 'utf8');

// Fix fullscreen bug (IsFullscreen should track state properly on mount)
takeTest = takeTest.replace(
    `  useEffect(() => {
    if (!testStarted) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };`,
    `  useEffect(() => {
    if (!testStarted) return;

    setIsFullscreen(!!document.fullscreenElement);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };`
);

// We need to hide the test content while isFullscreen is false. The user says: 
// "in normal screen only you show this dialog boxa and when the employee presses RESTORE FULLSCREEN NOW, the full window opens normally with the questions"
// We already have this via the overlay, but wait, if we hide the main test content, it is exactly what they asked.
takeTest = takeTest.replace(
    `        {testStarted && !isFullscreen && (`,
    `        {testStarted && !isFullscreen && (`
);

takeTest = takeTest.replace(
    `        {testStarted ? (`,
    `        {testStarted && isFullscreen ? (`
);

// Fix fonts and UI in TakeTest.tsx
takeTest = takeTest
    .replace(/font-black/g, 'font-semibold')
    .replace(/text-3xl/g, 'text-xl')
    .replace(/text-4xl/g, 'text-2xl')
    .replace(/h-14/g, 'h-10')
    .replace(/h-20/g, 'h-10')
    .replace(/rounded-\[.*?\]/g, 'rounded-lg')
    .replace(/rounded-2xl/g, 'rounded-md')
    .replace(/rounded-3xl/g, 'rounded-lg')
    .replace(/text-xl lg:text-2xl/g, 'text-base font-medium')
    .replace(/text-base font-medium text-foreground cursor-pointer/g, 'text-sm font-normal text-foreground cursor-pointer')
    .replace(/p-8 lg:p-12/g, 'p-4 lg:p-6')
    .replace(/w-10 h-10/g, 'w-8 h-8')
    .replace(/w-12 h-12/g, 'w-8 h-8')
    .replace(/w-16 h-16/g, 'w-10 h-10')
    .replace(/px-12/g, 'px-4')
    .replace(/p-12/g, 'p-6')
    .replace(/gap-6/g, 'gap-4')
    .replace(/gap-8/g, 'gap-4')
    .replace(/mb-8/g, 'mb-4')
    .replace(/variant="hero"/g, 'variant="default"');

fs.writeFileSync(takeTestPath, takeTest);

// Fix fonts and UI in CreateTest.tsx
let createTest = fs.readFileSync(createTestPath, 'utf8');
createTest = createTest
    .replace(/font-black/g, 'font-semibold')
    .replace(/text-3xl/g, 'text-xl')
    .replace(/text-2xl/g, 'text-lg')
    .replace(/h-14/g, 'h-10')
    .replace(/h-12/g, 'h-10')
    .replace(/h-11/g, 'h-9')
    .replace(/rounded-\[.*?\]/g, 'rounded-lg')
    .replace(/rounded-2xl/g, 'rounded-md')
    .replace(/rounded-xl/g, 'rounded-md')
    .replace(/p-8/g, 'p-4')
    .replace(/p-6/g, 'p-4')
    .replace(/gap-8/g, 'gap-4')
    .replace(/w-12 h-12/g, 'w-8 h-8')
    .replace(/uppercase tracking-widest/g, '')
    .replace(/uppercase tracking-\[.*?\]/g, '')
    .replace(/variant="hero"/g, 'variant="default"');

fs.writeFileSync(createTestPath, createTest);

console.log('UI Fix completed');
