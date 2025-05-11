document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ JavaScript is running!");

    // 🔹 토글링크 이벤트 추가
    const toggleLinks = document.querySelectorAll(".toggle-link");

    if (toggleLinks.length === 0) {
        console.warn("⚠️ No toggle links found!");
    } else {
        toggleLinks.forEach(link => {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                let file = this.getAttribute("data-file");

                console.log("✅ Clicked link, loading:", file);

                let contentBox = this.nextElementSibling;

                // ✅ `.hidden-content`가 존재하지 않으면 생성
                if (!contentBox || !contentBox.classList.contains("hidden-content")) {
                    console.warn("⚠️ No hidden content found. Creating a new one.");
                    contentBox = document.createElement("div");
                    contentBox.classList.add("hidden-content");
                    this.parentNode.insertBefore(contentBox, this.nextSibling);
                }

                if (contentBox.classList.contains("show")) {
                    console.log("🔄 Closing existing content");
                    contentBox.innerHTML = "";
                    contentBox.classList.remove("show");
                    return;
                }

                console.log("🔄 Fetching content from:", file);
                fetch(file)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`❌ Failed to load content: ${file}`);
                        }
                        return response.text();
                    })
                    .then(html => {
                        console.log("✅ Content loaded successfully:", file);
                        contentBox.innerHTML = html;
                        contentBox.classList.add("show");
                    })
                    .catch(error => {
                        console.error("❌ Error loading content:", error);
                        contentBox.innerHTML = "<p style='color: red;'>❌ 콘텐츠를 불러올 수 없습니다.</p>";
                    });
            });
        });
    }

    // 🔹 프로젝트 선택 드롭다운 이벤트 추가
    const projectSelect = document.getElementById("project-select");

    if (!projectSelect) {
        console.warn("⚠️ Project select element not found!");
        return;
    }

    projectSelect.addEventListener("change", function () {
        const selectedProject = this.value;
        if (selectedProject) {
            console.log("✅ Opening project:", selectedProject);
            window.open(selectedProject, "_blank"); // ✅ 새 창에서 열기
        }
    });
});
