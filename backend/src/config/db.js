const db=require('mongoose');


async function  main() {
    await db.connect(process.env.DATABASE_URL);
}


module.exports=main;



