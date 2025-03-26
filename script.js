// تنظیمات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDYh_T58FTQ73v-rgDEf9F07M3-4X3WIHc",
    authDomain: "maktab-seraj.firebaseapp.com",
    databaseURL: "https://maktab-seraj-default-rtdb.firebaseio.com",
    projectId: "maktab-seraj",
    storageBucket: "maktab-seraj.appspot.com",
    messagingSenderId: "940832832855",
    appId: "1:940832832855:web:b8154ce8eefbd0d19a1212",
    measurementId: "G-GSRTJTVGWL"
};

// راه‌اندازی Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database(app);
const votesRef = db.ref('votes');

document.addEventListener("DOMContentLoaded", () => {
    // وضعیت رأی کاربر
    const votedPerson = localStorage.getItem("votedPerson");
    
    // غیرفعال کردن دکمه‌ها اگر کاربر قبلاً رأی داده است
    if (votedPerson) {
        document.querySelectorAll('.vote-button').forEach(btn => {
            btn.disabled = true;
            btn.style.backgroundColor = '#6c757d';
        });
    }

    // رویداد کلیک برای دکمه‌های رأی
    document.querySelectorAll('.vote-button').forEach(button => {
        button.addEventListener('click', async () => {
            if (votedPerson) {
                alert(`شما قبلاً به ${votedPerson} رأی داده‌اید!`);
                return;
            }

            const id = button.getAttribute('data-id');
            if (confirm(`آیا مطمئن هستید که می‌خواهید به "${id}" رأی دهید؟`)) {
                try {
                    // افزایش رأی در Firebase
                    const snapshot = await votesRef.child(id).once('value');
                    const currentVotes = snapshot.val() || 0;
                    await votesRef.child(id).set(currentVotes + 1);

                    // ذخیره وضعیت رأی کاربر
                    localStorage.setItem('votedPerson', id);

                    // غیرفعال کردن دکمه‌ها
                    document.querySelectorAll('.vote-button').forEach(btn => {
                        btn.disabled = true;
                        btn.style.backgroundColor = '#6c757d';
                    });

                    // نمایش پیام موفقیت
                    alert('رأی شما با موفقیت ثبت شد!');
                    
                    // بروزرسانی نمایش آرا
                    const voteCount = document.querySelector(`.vote-count[data-id="${id}"]`);
                    if (voteCount) {
                        voteCount.textContent = `${currentVotes + 1} رأی`;
                    }
                } catch (error) {
                    console.error('خطا در ثبت رأی:', error);
                    alert('خطا در ثبت رأی. لطفاً دوباره تلاش کنید.');
                }
            }
        });
    });

    // نمایش نتایج برای ادمین
    document.getElementById('show-results').addEventListener('click', async () => {
        const password = prompt('لطفاً رمز عبور ادمین را وارد کنید:');
        if (password === 'admin123') {
            try {
                const snapshot = await votesRef.once('value');
                const votes = snapshot.val() || {};
                const total = Object.values(votes).reduce((sum, count) => sum + count, 0) || 1;
                
                let resultsHTML = '<h2>نتایج رأی‌گیری</h2>';
                Object.entries(votes).forEach(([id, count]) => {
                    const percent = ((count / total) * 100).toFixed(2);
                    resultsHTML += `<p>${id}: ${count} رأی (${percent}%)</p>`;
                });
                
                document.getElementById('results').innerHTML = resultsHTML;
                document.getElementById('results').style.display = 'block';
            } catch (error) {
                console.error('خطا در دریافت نتایج:', error);
                alert('خطا در دریافت نتایج. لطفاً دوباره تلاش کنید.');
            }
        } else if (password) {
            alert('رمز عبور اشتباه است!');
        }
    });

    // بارگذاری اولیه آرا از Firebase
    votesRef.on('value', (snapshot) => {
        const votes = snapshot.val() || {};
        document.querySelectorAll('.vote-count').forEach(span => {
            const id = span.getAttribute('data-id');
            span.textContent = `${votes[id] || 0} رأی`;
        });
    });
});