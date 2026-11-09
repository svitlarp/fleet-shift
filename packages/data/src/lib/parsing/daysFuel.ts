
const day1 = Date.parse("2015-01-03T11:01:38");
// const day2 = Date.parse("2015-03-20T09:02:46");
// const day3 = Date.parse("2015-04-02T09:03:39");

const day2 = Date.parse("2015-03-20T19:55:46");
const day3 = Date.parse("2015-03-21T08:03:39");
console.log(typeof day1);
console.log(day2);

const diffMs = day3 - day2;
console.log(diffMs)

// const diffDays = diffMs / (1000 * 60 * 60 * 24);
// console.log(diffDays);