import mysql from 'mysql2/promise';

async function fix() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'rootpassword',
  });

  try {
    console.log('Attempting to fix user auth...');
    await connection.execute("ALTER USER 'techu_app'@'%' IDENTIFIED WITH mysql_native_password BY 'strong-password'");
    await connection.execute("FLUSH PRIVILEGES");
    console.log('Successfully updated techu_app@%');
  } catch (e) {
    console.error('Failed to update techu_app@%:', e.message);
  }

  try {
    await connection.execute("ALTER USER 'techu_app'@'localhost' IDENTIFIED WITH mysql_native_password BY 'strong-password'");
    await connection.execute("FLUSH PRIVILEGES");
    console.log('Successfully updated techu_app@localhost');
  } catch (e) {
    console.error('Failed to update techu_app@localhost:', e.message);
  }

  await connection.end();
}

fix().catch(console.error);
