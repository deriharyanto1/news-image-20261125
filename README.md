# The World Today — 25 November 2026

[![news-image-20261125](https://make.fun/badge/news-image-20261125.svg)](https://make.fun/bounty/news-image-20261125)
[![rank](https://make.fun/badge/news-image-20261125/deriharyanto1/news-image-20261125/rank.svg)](https://make.fun/bounty/news-image-20261125)
[![reward](https://make.fun/badge/news-image-20261125/deriharyanto1/news-image-20261125/reward.svg)](https://make.fun/bounty/news-image-20261125)

A one-page newspaper that sums up the world's news of Wednesday 25 November 2026, for the [news-image-20261125 bounty](https://make.fun/bounty/news-image-20261125).

## The paper

**50 stories from 10 regions** — North America, South America, Western Europe, Eastern Europe, the Middle East, Africa, South Asia, East Asia, Southeast Asia and Oceania — on a single 1024×1024 page:

- **Top story:** Shenzhou-24 carries Pakistan's Muhammad Zeeshan Ali, 40, into orbit — the first Pakistani in space and the first foreign astronaut aboard China's Tiangong station.
- **9 panels:** the Trump tariff probe, strikes in Odesa and Kyiv, the Houthi drone hit on Riyadh's PIF tower, the Chen Jining investigation, the trapped Pongkor miners, the Asian market sell-off, the WHO evacuation in Ituri, France's rejection of the EU budget, and a 15-year-old's 204 off 53 balls.
- **39 one-line briefs** across all ten regions, plus an editor's-note quote box.

Every fact was first reported on 25 November 2026 (Reuters / AP / Xinhua wires).

## How it is made

`main.ts` (Node 22, standard library only) draws the whole page itself: a hand-built 5×7 vector font, a small PNG encoder (zlib deflate + CRC32), and the newspaper layout. No network, no image assets — the program is fully deterministic, and two runs write byte-identical `entry.png` files.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
