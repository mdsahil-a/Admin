// fullMovieExtractor.js

import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';
import * as cheerio from 'https://cdn.jsdelivr.net/npm/cheerio@1.0.0-rc.12/+esm';
// fullMovieExtractor.js

const MOVIE_NAME = "Border 2"; //  this to search for a different movie

const BASE_URL = "https://filmyfly.camp";
let data=[];

export const fetchExtractData = async (movieName) => {
console.log("Starting movie data extraction for:", movieName);
await getMovie(movieName);
    return data;
}



async function getMovie(movieName) {

    try {

        // ===================================
        // 1. SEARCH MOVIE
        // ===================================

        const searchUrl =
            `${BASE_URL}/site-1.html?to-search=${encodeURIComponent(movieName)}`;

        const { data: searchHtml } = await axios.get(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        const $ = cheerio.load(searchHtml);

        // ===================================
        // GET ALL SEARCH RESULTS
        // ===================================

        let movies = [];

        $(".A2").each((i, el) => {

            const title =
                $(el).find("a").last().text().trim();

            const link =
                $(el).find("a").last().attr("href");

            movies.push({
                title,
                link
            });
        });

        if (movies.length === 0) {

            console.log("Movie not found");
            return;
        }

        // ===================================
        // SMART TITLE MATCHING
        // ===================================

        function normalize(str) {

            return str
                .toLowerCase()
                .replace(/[\(\)\[\]\-_:.,]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
        }

        function getScore(search, title) {

            const s = normalize(search);
            const t = normalize(title);

            let score = 0;

            // Exact match
            if (t === s)
                score += 1000;

            // Starts with search
            if (t.startsWith(s))
                score += 500;

            // Contains full search
            if (t.includes(s))
                score += 300;

            // Word matching
            const searchWords = s.split(" ");
            const titleWords = t.split(" ");

            for (const word of searchWords) {

                if (titleWords.includes(word)) {
                    score += 50;
                }
            }

            // Year matching
            const yearMatch =
                s.match(/\b(19|20)\d{2}\b/);

            if (yearMatch) {

                const year = yearMatch[0];

                if (t.includes(year)) {
                    score += 400;
                }
            }

            // Prefer shorter titles
            score -= titleWords.length;

            return score;
        }

        // ===================================
        // SORT BY BEST MATCH
        // ===================================

        movies.sort((a, b) =>
            getScore(movieName, b.title) -
            getScore(movieName, a.title)
        );

        // ===================================
        // BEST MATCH MOVIE
        // ===================================

        let moviePage = movies[0].link;

        console.log("Selected Movie:");
        console.log(movies[0].title);
        data.push({ title: movies[0].title });

        if (!moviePage.startsWith("http")) {

            moviePage = BASE_URL + moviePage;
        }

        // ===================================
        // 2. OPEN MOVIE PAGE
        // ===================================

        const { data: movieHtml } = await axios.get(moviePage, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        const $$ = cheerio.load(movieHtml);

        const title =
            $$("h2").first().text().trim();

        const image =
            $$(".movie-thumb img").attr("src") || "";

        // Main download page
        const downloadPage =
            $$(".dlbtn a").attr("href") ||
            $$("a.dl").attr("href") ||
            "";

        // ===================================
        // 3. OPEN DOWNLOAD PAGE
        // ===================================

        const qualitiesMap = {
            "480p": null,
            "720p": null,
            "1080p": null
        };

        if (downloadPage) {

            const { data: downloadHtml } = await axios.get(downloadPage, {
                headers: {
                    "User-Agent": "Mozilla/5.0"
                }
            });

            const $$$ = cheerio.load(downloadHtml);

            $$$("a").each((i, el) => {

                const text =
                    $$$(el)
                        .text()
                        .replace(/\s+/g, " ")
                        .trim();

                const href =
                    $$$(el).attr("href");

                if (!href || !href.startsWith("http"))
                    return;

                // Ignore internal links
                if (href.includes("linkmake.in"))
                    return;

                let quality = "";

                if (/480/i.test(text)) {

                    quality = "480p";

                } else if (/720/i.test(text)) {

                    quality = "720p";

                } else if (/1080/i.test(text)) {

                    quality = "1080p";

                } else {

                    return;
                }

                // Already selected
                if (qualitiesMap[quality])
                    return;

                // Extract size
                const sizeMatch =
                    text.match(/(\d+(?:\.\d+)?\s?(?:GB|MB))/i);

                const size =
                    sizeMatch ? sizeMatch[1] : "";

                qualitiesMap[quality] = {
                    quality,
                    size,
                    pageLink: href
                };

            });

        }

        // ===================================
        // GET REAL DOWNLOAD LINKS
        // ===================================

        let qualities = [];

        for (const item of Object.values(qualitiesMap).filter(Boolean)) {

            try {

                // ===============================
                // OPEN QUALITY PAGE
                // ===============================

                const { data: qualityHtml } =
                    await axios.get(item.pageLink, {
                        headers: {
                            "User-Agent": "Mozilla/5.0"
                        }
                    });

                const page =
                    cheerio.load(qualityHtml);

                let realDownloadLink = null;

                // ===============================
                // FIND FAST DIRECT DOWNLOAD
                // ===============================

                page("a").each((i, el) => {

                    const text =
                        page(el)
                            .text()
                            .replace(/\s+/g, " ")
                            .trim();

                    const href =
                        page(el).attr("href");

                    if (
                        href &&
                        text.includes("Fast Direct Download")
                    ) {

                        realDownloadLink = href;
                    }
                });

                // ===============================
                // SAVE RESULT
                // ===============================

                if (realDownloadLink) {

                    qualities.push({

                        quality: item.quality,

                        size: item.size,

                        downloadLink: realDownloadLink
                    });
                    data.push({

                        quality: item.quality,
                        size: item.size,
                        downloadLink: realDownloadLink
                    });
                    console.log("Data searchMovie:", data);
                }

            } catch (err) {

                console.log(
                    `Error fetching ${item.quality}:`,
                    err.message
                );
            }
        }

        // ===================================
        // NO LINKS FOUND
        // ===================================

        if (qualities.length === 0) {

            searchMovie(movieName);
            return;
        }

        // ===================================
        // FINAL OUTPUT
        // ===================================

        const result = {
            title,
            image,
            qualities
        };

      
         JSON.stringify(result.qualities, null, 4)


    }

    catch (err) {

        console.log("Error:", err.message);
    }

}
// Example
// getMovie(MOVIE_NAME);
async function searchMovie(name) {

    const BASE_URL = "https://filmyfly.camp";

    const searchUrl =
        `${BASE_URL}/site-1.html?to-search=${encodeURIComponent(name)}`;

    // =====================================
    // FETCH SEARCH PAGE
    // =====================================

    const searchResponse =
        await axios.get(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

    const $ =
        cheerio.load(searchResponse.data);

    let movies = [];

    $(".A2").each((i, el) => {

        const title =
            $(el)
                .find("a")
                .last()
                .text()
                .trim();

        const link =
            $(el)
                .find("a")
                .last()
                .attr("href");

        const image =
            $(el)
                .find("img")
                .attr("src");

        movies.push({
            title,
            link: BASE_URL + link,
            image
        });
    });

    // =====================================
    // CHECK MOVIES
    // =====================================

    if (movies.length === 0) {

        console.log("No movies found.");
        return;
    }

    // =====================================
    // FETCH FIRST MOVIE PAGE
    // =====================================

    const firstMovie = movies[0];

    console.log("Selected Movie:");
    console.log(firstMovie.title);

    const moviePageResponse =
        await axios.get(firstMovie.link, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

    const $$ =
        cheerio.load(moviePageResponse.data);

    // =====================================
    // GET ALL LINKS PAGE
    // =====================================

    let allLinksPage = null;

    $$("a").each((i, el) => {

        const text =
            $$(el)
                .text()
                .replace(/\s+/g, " ")
                .trim();

        const href =
            $$(el).attr("href");

        if (
            href &&
            text.includes("All Links")
        ) {

            allLinksPage =
                href.startsWith("http")
                    ? href
                    : BASE_URL + href;
        }
    });

    if (!allLinksPage) {

        console.log("All links page not found.");
        
        return;
    }

    // =====================================
    // FETCH ALL LINKS PAGE
    // =====================================

    const linksPageResponse =
        await axios.get(allLinksPage, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

    const $$$ =
        cheerio.load(linksPageResponse.data);

    // =====================================
    // STORE FIRST 480 / 720 / 1080
    // =====================================

    let selected = {
        "480p": null,
        "720p": null,
        "1080p": null
    };

    $$$("a").each((i, el) => {

        const text =
            $$$(el)
                .text()
                .replace(/\s+/g, " ")
                .trim();

        const href =
            $$$(el).attr("href");

        if (!href)
            return;

        // =================================
        // EXTRACT SIZE
        // =================================

        const sizeMatch =
            text.match(/Download\s+([^\s]+)/i);

        const size =
            sizeMatch
                ? sizeMatch[1]
                : "Unknown";

        // =================================
        // 480p
        // =================================

        if (
            !selected["480p"] &&
            (
                text.includes("{480p-HEVC}") ||
                text.includes("{480p-HD}")
            )
        ) {

            selected["480p"] = {
                quality: "480p",
                size,
                pageLink: href
            };
        }

        // =================================
        // 720p
        // =================================

        if (
            !selected["720p"] &&
            (
                text.includes("{720p-HEVC}") ||
                text.includes("{720p-HD}")
            )
        ) {

            selected["720p"] = {
                quality: "720p",
                size,
                pageLink: href
            };
        }

        // =================================
        // 1080p
        // =================================

        if (
            !selected["1080p"] &&
            (
                text.includes("{1080p-HEVC}") ||
                text.includes("{1080p-HD}") ||
                text.includes("{1080p-FHD}")
            )
        ) {

            selected["1080p"] = {
                quality: "1080p",
                size,
                pageLink: href
            };
        }
    });

    // =====================================
    // REMOVE NULL VALUES
    // =====================================

    const selectedQualities =
        Object.values(selected)
            .filter(item => item !== null);

    // =====================================
    // FETCH FINAL DOWNLOAD LINKS
    // =====================================

    let finalLinks = [];

    for (const item of selectedQualities) {

        try {

            // ===============================
            // OPEN QUALITY PAGE
            // ===============================

            const response =
                await axios.get(item.pageLink, {
                    headers: {
                        "User-Agent": "Mozilla/5.0"
                    }
                });

            const page =
                cheerio.load(response.data);

            let mediafirePageLink = null;

            // ===============================
            // FIND DOWNLOAD FILE BUTTON
            // ===============================

            page("a").each((i, el) => {

                const text =
                    page(el)
                        .text()
                        .replace(/\s+/g, " ")
                        .trim();

                const href =
                    page(el).attr("href");

                if (
                    href &&
                    text.includes("DOWNLOAD FILE")
                ) {

                    mediafirePageLink = href;
                }
            });

            // ===============================
            // GET REAL MEDIAFIRE DOWNLOAD LINK
            // ===============================

            let actualDownloadLink = null;

            if (mediafirePageLink) {

                try {

                    // Add /file if missing
                    let mediafireUrl =
                        mediafirePageLink;

                    if (
                        !mediafireUrl.endsWith("/file")
                    ) {

                        mediafireUrl += "/file";
                    }

                    const mediafireResponse =
                        await axios.get(mediafireUrl, {
                            headers: {
                                "User-Agent": "Mozilla/5.0"
                            }
                        });

                    const mediafirePage =
                        cheerio.load(
                            mediafireResponse.data
                        );

                    // =========================
                    // GET DOWNLOAD BUTTON HREF
                    // =========================

                    actualDownloadLink =
                        mediafirePage("#downloadButton")
                            .attr("href") || null;

                } catch (err) {

                    console.log(
                        `Mediafire error (${item.quality}):`,
                        err.message
                    );
                }
            }

            // ===============================
            // SAVE FINAL RESULT
            // ===============================

            finalLinks.push({

                quality: item.quality,

                size: item.size,

                downloadLink:
                    actualDownloadLink || null
            });
            data.push({

                quality: item.quality,
                size: item.size,
                downloadLink:
                    actualDownloadLink || null
            });
console.log("Data searchMovie:", data);
        } catch (error) {

            console.log(
                `Error fetching ${item.quality}:`,
                error.message
            );

            finalLinks.push({

                quality: item.quality,

                size: item.size,

                downloadLink: null
            });
        }
    }

    // =====================================
    // FINAL OUTPUT
    // =====================================

    // console.log(
    //     JSON.stringify(finalLinks, null, 4)
    // );


}

