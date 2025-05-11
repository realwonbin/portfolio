document.addEventListener("DOMContentLoaded", function () {
    console.log("JavaScript is running!"); // 디버깅용 로그 추가

    const toggleLinks = document.querySelectorAll(".toggle-link");

    if (toggleLinks.length === 0) {
        console.error("No toggle links found!");
        return;
    }

    toggleLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault(); // 기본 링크 동작 방지
            const file = this.getAttribute("data-file"); // 불러올 파일 경로 가져오기
            console.log("Clicked link, loading:", file);

            // 기존 콘텐츠 닫기
            let existingContent = this.parentNode.querySelector(".hidden-content");
            if (existingContent) {
                console.log("Closing existing content");
                existingContent.remove();
                return;
            }

            // 새 콘텐츠 생성
            const contentBox = document.createElement("div");
            contentBox.classList.add("hidden-content");

            // fetch()로 HTML 파일 불러오기
            fetch(file)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load content: ${file}`);
                    }
                    return response.text();
                })
                .then(html => {
                    console.log("Content loaded successfully:", file);
                    contentBox.innerHTML = html;
                    this.parentNode.insertBefore(contentBox, this.nextSibling);
                    setTimeout(() => contentBox.classList.add("show"), 10);
                })
                .catch(error => {
                    console.error("Error loading content:", error);
                    contentBox.innerHTML = "<p>콘텐츠를 불러오지 못했습니다.</p>";
                });
        });
    });
});
