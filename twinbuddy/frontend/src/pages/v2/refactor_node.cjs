const fs = require('fs');

const buddies_path = 'e:/desktop/hecker/twinbuddy/frontend/src/pages/v2/BuddiesPage.tsx';
const community_path = 'e:/desktop/hecker/twinbuddy/frontend/src/pages/v2/CommunityPage.tsx';

let buddies_code = fs.readFileSync(buddies_path, 'utf8');
let community_code = fs.readFileSync(community_path, 'utf8');

function apply_brutalism(code) {
    code = code.replace(/glass-panel-strong/g, 'bg-surface-container-lowest brutalist-card-active rounded-DEFAULT border-2 border-outline');
    code = code.replace(/glass-panel/g, 'bg-surface-container-lowest brutalist-card-inactive rounded-DEFAULT border-2 border-outline transition-all duration-300');
    
    code = code.replace(/text-white/g, 'text-on-background font-h1 placeholder:text-on-surface-variant');
    code = code.replace(/text-\[var\(--color-text-secondary\)\]/g, 'text-on-surface-variant font-body-md');
    code = code.replace(/text-\[var\(--color-secondary\)\]/g, 'text-primary font-body-md');
    code = code.replace(/text-\[var\(--color-primary-light\)\]/g, 'text-error font-body-md');
    code = code.replace(/text-\[var\(--color-primary\)\]/g, 'text-primary font-body-md');
    code = code.replace(/text-tertiary/g, 'text-tertiary font-body-md');
    
    code = code.replace(/bg-\[rgba\(74,222,128,0\.12\)\]/g, 'bg-secondary-container text-on-secondary-container border-2 border-outline');
    code = code.replace(/bg-\[rgba\(238,194,36,0\.08\)\]/g, 'bg-tertiary-container text-on-tertiary-container border-2 border-outline');
    code = code.replace(/border-\[rgba\(238,194,36,0\.28\)\]/g, 'border-outline');
    code = code.replace(/border-\[rgba\(74,222,128,0\.18\)\]/g, 'border-outline');
    code = code.replace(/bg-\[rgba\(74,222,128,0\.08\)\]/g, 'bg-secondary-container');
    code = code.replace(/bg-\[rgba\(93,32,32,0\.24\)\]/g, 'bg-error-container text-on-error-container border-2 border-error');
    code = code.replace(/border-\[rgba\(248,113,113,0\.2\)\]/g, 'border-error');
    
    code = code.replace(/bg-\[rgba\(74,222,128,0\.1\)\]/g, 'bg-surface-container-high');
    
    code = code.replace(/border-white\/8/g, 'border-outline');
    code = code.replace(/border-white\/12/g, 'border-outline');
    code = code.replace(/bg-black\/10/g, 'bg-surface-container');
    code = code.replace(/bg-white\/4/g, 'bg-surface-container-high border-[1px]');
    
    code = code.replace(/neon-input/g, 'border-2 border-outline rounded-DEFAULT bg-surface-container-lowest text-on-background px-4 py-3 placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all');
    code = code.replace(/className="tag"/g, 'className="font-label-caps text-label-caps px-3 py-1 rounded-full uppercase border-2 border-outline bg-surface-variant text-on-surface-variant"');
    code = code.replace(/btn-primary/g, 'bg-primary text-on-primary font-body-md px-4 py-2 rounded-DEFAULT border-2 border-transparent hover:brightness-110 active:scale-95 transition-all');
    code = code.replace(/btn-secondary/g, 'bg-secondary text-on-secondary font-body-md px-4 py-2 rounded-DEFAULT border-2 border-outline hover:bg-secondary-container hover:text-on-secondary-container transition-all');

    return code;
}

buddies_code = apply_brutalism(buddies_code);
community_code = apply_brutalism(community_code);

fs.writeFileSync(buddies_path, buddies_code, 'utf8');
fs.writeFileSync(community_path, community_code, 'utf8');

console.log("Refactored JSX classes!");