document.addEventListener("DOMContentLoaded", () => {
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
    const votesRef = db.ref('votes');

    // متغیرهای محلی
    let localVotes = JSON.parse(localStorage.getItem("votes")) || {};
    let votedPerson = localStorage.getItem("votedPerson");

    // همگام‌سازی با Firebase
    function syncWithFirebase() {
        votesRef.on('value', (snapshot) => {
            const firebaseVotes = snapshot.val() || {};
            
            // ادغام آرا از Firebase و localStorage
            const mergedVotes = {...firebaseVotes, ...localVotes};
            
            // به‌روزرسانی نمایش
            updateVotesDisplay(mergedVotes);
            
            // ذخیره محلی برای جلوگیری از تأخیر
            localStorage.setItem("votes", JSON.stringify(mergedVotes));
        });
    }

    // به‌روزرسانی نمایش تعداد رأی‌ها
    function updateVotesDisplay(votes) {
        document.querySelectorAll(".vote-count").forEach(span => {
            const id = span.getAttribute("data-id");
            span.textContent = `${votes[id] || 0} رای`;
        });
    }

    // غیرفعال‌سازی دکمه‌ها پس از رأی
    function disableVoteButtons() {
        document.querySelectorAll(".vote-button").forEach(button => {
            button.disabled = !!votedPerson;
        });

        if (votedPerson) {
            alert(`شما قبلاً به "${votedPerson}" رأی داده‌اید!`);
        }
    }

    // ثبت رأی جدید
    async function submitVote(id) {
        if (votedPerson) {
            alert("شما قبلاً رأی داده‌اید!");
            return;
        }

        try {
            // افزایش رأی در Firebase
            const voteRef = db.ref('votes/' + id);
            const snapshot = await voteRef.once('value');
            const currentVotes = snapshot.val() || 0;
            await voteRef.set(currentVotes + 1);

            // ذخیره محلی
            localVotes[id] = (localVotes[id] || 0) + 1;
            localStorage.setItem("votes", JSON.stringify(localVotes));
            localStorage.setItem("votedPerson", id);
            votedPerson = id;

            // به‌روزرسانی UI
            updateVotesDisplay(localVotes);
            disableVoteButtons();
            
            alert(`رأی شما به "${id}" با موفقیت ثبت شد!`);
        } catch (error) {
            console.error("خطا در ثبت رأی:", error);
            alert("خطا در ثبت رأی. لطفاً دوباره تلاش کنید.");
        }
    }

    // مدیریت دکمه‌های رأی
    document.querySelectorAll(".vote-button").forEach(button => {
        button.addEventListener("click", () => {
            const id = button.getAttribute("data-id");
            
            if (confirm(`آیا مطمئن هستید که می‌خواهید به "${id}" رأی دهید؟`)) {
                submitVote(id);
            }
        });
    });

    // مدیریت نمایش نتایج برای ادمین
    document.getElementById("show-results").addEventListener("click", () => {
        const password = prompt("لطفاً رمز عبور ادمین را وارد کنید:");
        
        if (password === "admin123") {
            votesRef.once('value').then(snapshot => {
                const votes = snapshot.val() || {};
                const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0) || 1;
                
                let resultsHTML = "<h2>نتایج رأی‌گیری</h2>";
                Object.entries(votes).forEach(([id, count]) => {
                    const percentage = ((count / totalVotes) * 100).toFixed(2);
                    resultsHTML += `<p>${id}: ${count} رأی (${percentage}%)</p>`;
                });
                
                document.getElementById("results").innerHTML = resultsHTML;
                document.getElementById("results").style.display = "block";
            });
        } else {
            alert("رمز عبور اشتباه است!");
        }
    });

    // مقداردهی اولیه
    syncWithFirebase();
    disableVoteButtons();
});