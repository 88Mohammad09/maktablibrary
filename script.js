// تنظیمات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDYh_T58FTQ73v-rgDEf9F07M3-4X3WIHc",
    authDomain: "maktab-seraj.firebaseapp.com",
    databaseURL: "https://maktab-seraj-default-rtdb.firebaseio.com",
    projectId: "maktab-seraj",
    storageBucket: "maktab-seraj.firebasestorage.app",
    messagingSenderId: "940832832855",
    appId: "1:940832832855:web:b8154ce8eefbd0d19a1212",
    measurementId: "G-GSRTJTVGWL"
};

// راه‌اندازی Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database(app);

// متغیرهای全局
let hasVoted = localStorage.getItem('hasVoted') === 'true';
const ADMIN_PASSWORD = "admin123";

// تابع برای نمایش پیام به کاربر
function showAlert(message, isError = false) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${isError ? 'error' : 'success'}`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// تابع برای بارگذاری اولیه آرا
function loadInitialVotes() {
    const votesRef = db.ref('votes');
    votesRef.on('value', (snapshot) => {
        const votesData = snapshot.val() || {};
        
        document.querySelectorAll('.vote-count').forEach(element => {
            const id = element.getAttribute('data-id');
            if (votesData[id]) {
                element.textContent = `${votesData[id]} رأی`;
            }
        });
    });
}

// تابع برای ذخیره رأی در Firebase
async function submitVote(id) {
    try {
        if (hasVoted) {
            showAlert('شما قبلاً رأی داده‌اید!', true);
            return;
        }

        if (!confirm(`آیا مطمئن هستید که می‌خواهید به "${id}" رأی دهید؟`)) {
            return;
        }

        const voteRef = db.ref('votes/' + id);
        const snapshot = await voteRef.once('value');
        const currentVotes = snapshot.val() || 0;
        
        await voteRef.set(currentVotes + 1);
        
        const voteCountElement = document.querySelector(`.vote-count[data-id="${id}"]`);
        if (voteCountElement) {
            voteCountElement.textContent = `${currentVotes + 1} رأی`;
        }
        
        localStorage.setItem('hasVoted', 'true');
        hasVoted = true;
        
        document.querySelectorAll('.vote-button').forEach(btn => {
            btn.disabled = true;
            btn.style.backgroundColor = '#6c757d';
        });
        
        showAlert('رأی شما با موفقیت ثبت شد!');
    } catch (error) {
        console.error('Error submitting vote:', error);
        showAlert('خطا در ثبت رأی. لطفاً دوباره تلاش کنید.', true);
    }
}

// تابع برای نمایش نتایج
async function showResults() {
    try {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '<p>در حال دریافت نتایج...</p>';
        resultsDiv.style.display = 'block';
        
        const votesRef = db.ref('votes');
        const snapshot = await votesRef.once('value');
        const votesData = snapshot.val() || {};
        
        let resultsHTML = '<h2>نتایج رأی‌گیری</h2>';
        let totalVotes = 0;
        let voteDetails = [];

        for (let id in votesData) {
            const voteCount = votesData[id];
            totalVotes += voteCount;
            voteDetails.push({ id, voteCount });
        }

        voteDetails.sort((a, b) => b.voteCount - a.voteCount);

        if (totalVotes === 0) {
            resultsHTML += '<p>هنوز رأیی ثبت نشده است.</p>';
        } else {
            resultsHTML += `<p class="total-votes">تعداد کل آرا: ${totalVotes}</p>`;
            resultsHTML += '<div class="results-list">';
            
            voteDetails.forEach(item => {
                const percentage = totalVotes > 0 
                    ? (item.voteCount / totalVotes * 100).toFixed(2)
                    : 0;
                
                resultsHTML += `
                    <div class="result-item">
                        <span class="name">${item.id}</span>
                        <span class="votes">${item.voteCount} رأی</span>
                        <span class="percentage">${percentage}%</span>
                    </div>
                `;
            });
            
            resultsHTML += '</div>';
        }
        
        resultsDiv.innerHTML = resultsHTML;
    } catch (error) {
        console.error('Error fetching results:', error);
        showAlert('خطا در دریافت نتایج. لطفاً دوباره تلاش کنید.', true);
    }
}

// تابع برای نمایش نتایج با رمز عبور
function promptPassword() {
    const password = prompt("لطفاً رمز عبور مدیریتی را وارد کنید:");
    
    if (password === ADMIN_PASSWORD) {
        showResults();
    } else if (password) {
        showAlert('رمز عبور اشتباه است!', true);
    }
}

// مقداردهی اولیه هنگام لود صفحه
document.addEventListener('DOMContentLoaded', function() {
    // بارگذاری اولیه آرا
    loadInitialVotes();

    // اتصال رویداد کلیک به دکمه‌ها
    document.querySelectorAll('.vote-button').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            submitVote(id);
        });
    });
});