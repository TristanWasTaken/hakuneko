import WordPressMangastream from './templates/WordPressMangastream.mjs';

export default class RadiantScans extends WordPressMangastream {
    constructor() {
        super();
        super.id = 'radiantscans';
        super.label = 'RadiantScans';
        this.tags = ['manga', 'english', 'scanlation'];
        this.url = 'https://radiantscans.com';
        this.path = '/series/list-mode/';

        this.queryChapters = 'div#chapterlist ul li a';
        this.queryStylePages = 'div#readerarea div[style*="background-image"]';
    }

    get icon() {
        return '/img/connectors/luminousscans';
    }

    async _getPages(chapter) {
        const script = `
            new Promise((resolve, reject) => {
                setTimeout(() => {
                    try {
                        const images = [...document.querySelectorAll('div#readerarea img[src]:not([src=""])')];
                            
                        // try img.src first, then try style background images
                        if (images.length >= 1) {
                            resolve(images.map(image => image.dataset['lazySrc'] || image.dataset['src'] || image.getAttribute('original') ||  image.src));
                        } else {
                            const style = [...document.querySelectorAll('div#readerarea div[style*="background-image"]')];

                            // use replace instead of match because weird error
                            resolve(style.map(img => img.style.backgroundImage
                                // don't use replace (regex) to avoid weird '"("<url>")"' replace issue
                                .trim()
                                .slice(4, -1)
                                .trim()
                                .replace(/^['"\(]+|['"\)]+$/g, '')
                            ));
                        }
                    } catch(error) {
                        reject(error);
                    }
                }, 2500);
            });
        `;
        //(await super._getPages(chapter)).filter(image => !/\/NovelBanner[^.]+\.(png|jpeg|jpg|gif)$/i.test(image));
        const uri = new URL(chapter.id, this.url);
        let request = new Request(uri, this.requestOptions);
        let data = await Engine.Request.fetchUI(request, script);
        // HACK: bypass 'i0.wp.com' image CDN to ensure original images are loaded directly from host
        let images = data.map(link => new URL(link).toString()
            .replace(/\/i\d+\.wp\.com/, '')
            // replace broken domain with new
            .replace('luminousscans.com', 'radiantscans.com'))
            .filter(link => !link.includes('histats.com'))
            // filter out novel banners
            .filter(image => !/\/NovelBanner[^.]+\.(png|jpeg|jpg|gif)$/i.test(image))
            // old credit page 404's, makes valid downloads fail
            .filter(image => !image.includes('/fypadsuh/2021/06/13.png'))
            .filter(image => !image.includes('fypadsuh/2021/06/page999_batogenkan-10.png'))
            .filter(image => !image.includes('/fypadsuh/2021/06/page999.png'))
            // filter out broken asura hotlinks
            .filter(image => !image.includes('asuratoon.com'));
        return images;
    }
}