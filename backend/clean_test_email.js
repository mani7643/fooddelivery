import nodemailer from 'nodemailer';

const user = process.argv[2];
const pass = process.argv[3];

if (!user || !pass) {
    console.error('Usage: node clean_test_email.js <EMAIL_ADDRESS> <APP_PASSWORD>');
    process.exit(1);
}

console.log(`Testing credentials for: ${user}`);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: user,
        pass: pass
    }
});

const run = async () => {
    try {
        await transporter.verify();
        console.log('✅ Success! Your credentials work.');

        await transporter.sendMail({
            from: user,
            to: user, // send to self
            subject: 'Test Connection',
            text: 'It works!'
        });
        console.log('✅ Email sent successfully.');
    } catch (err) {
        console.error('❌ Failed:', err.message);
        if (err.message.includes('Username and Password not accepted')) {
            console.error('👉 Tip: Double check your App Password. It should have NO spaces.');
        }
    }
};

run();
