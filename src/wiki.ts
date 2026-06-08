import { ITimelineCustomEventDetails } from "./timeline";

export const initWiki = (
  wikiContainer: HTMLElement,
  timelineContainer: HTMLElement,
) => {
  timelineContainer.addEventListener("selected.tl.event", async (e) => {
    const detail = (e as CustomEvent<ITimelineCustomEventDetails>).detail;
    const wikiPath = detail.timelineEvent?.wiki;

    if (!wikiPath) {
      wikiContainer.style.display = "none";
      return;
    }

    wikiContainer.style.display = "block";
    wikiContainer.innerHTML = "<p>Loading Wikipedia content...</p>";

    try {
      let url = wikiPath;
      if (!wikiPath.startsWith("http")) {
        // Assume it's a title
        url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          wikiPath,
        )}`;
      } else if (wikiPath.includes("wikipedia.org/wiki/")) {
        // Convert page URL to API URL
        const title = wikiPath.split("wikipedia.org/wiki/")[1].split(/[#?]/)[0];
        url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          title,
        )}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Wikipedia content not found");

      const data = await response.json();
      renderWiki(wikiContainer, data);
    } catch (error) {
      wikiContainer.innerHTML = `<p>Error loading Wikipedia content: ${error}</p>`;
    }
  });
};

const renderWiki = (container: HTMLElement, data: any) => {
  const { title, extract_html, thumbnail, content_urls } = data;

  let html = `
    <div class="wiki-content">
      <h3>${title}</h3>
      <div class="wiki-body">
        ${thumbnail ? `<img src="${thumbnail.source}" alt="${title}" style="float: right; margin-left: 1rem; max-width: 200px;">` : ""}
        ${extract_html}
      </div>
      <div style="clear: both; margin-top: 1rem;">
        <a href="${content_urls.desktop.page}" target="_blank">Read more on Wikipedia</a>
      </div>
    </div>
  `;

  container.innerHTML = html;
};
