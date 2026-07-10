const l = require("./package-lock.json");

console.log("lockfileVersion =", l.lockfileVersion);
console.log("root =", l.packages[""]);
console.log("has dependencies object =", !!l.dependencies);
