from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "public" / "reports" / "final-captures" / "screen-1.png"
OUTPUT = ROOT / "public" / "reports" / "page7_actual_access_map.png"

FONT_REGULAR = Path("C:/Windows/Fonts/malgun.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/malgunbd.ttf")


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    font_path = FONT_BOLD if bold and FONT_BOLD.exists() else FONT_REGULAR
    return ImageFont.truetype(str(font_path), size)


def main() -> None:
    image = Image.open(INPUT).convert("RGBA")

    # Final dashboard screen-1 map panel from the 1920x1080 capture.
    map_crop = image.crop((46, 347, 1392, 907)).resize((1328, 552), Image.Resampling.LANCZOS)

    out_w, out_h = 1400, 760
    map_x, map_y = 36, 36
    canvas = Image.new("RGBA", (out_w, out_h), "#f8f5ed")
    canvas.alpha_composite(map_crop, (map_x, map_y))

    frame = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))
    frame_draw = ImageDraw.Draw(frame)
    frame_draw.rounded_rectangle((map_x, map_y, map_x + 1328, map_y + 552), radius=10, outline="#d8d0c2", width=2)
    canvas.alpha_composite(frame)

    panel_w, panel_h = 1284, 112
    panel_x, panel_y = map_x + 22, map_y + 552 + 24
    shadow = Image.new("RGBA", (panel_w + 20, panel_h + 20), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((10, 10, panel_w + 10, panel_h + 10), radius=10, fill=(16, 42, 67, 32))
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))
    canvas.alpha_composite(shadow, (panel_x - 10, panel_y - 10))

    panel = Image.new("RGBA", (panel_w, panel_h), (0, 0, 0, 0))
    panel_draw = ImageDraw.Draw(panel)
    panel_draw.rounded_rectangle((0, 0, panel_w, panel_h), radius=10, fill="#fffefa", outline="#d8d0c2", width=2)
    canvas.alpha_composite(panel, (panel_x, panel_y))

    draw = ImageDraw.Draw(canvas)
    base_x = map_x + 46
    base_y = map_y + 552 + 54
    draw.text((base_x, base_y), "대표 생활권 접근성 기준", font=load_font(25, True), fill="#132635")

    items = [
        ("#246a64", "대체로 양호: 70점 이상", base_x, base_y + 42),
        ("#b7a35a", "주의 관찰: 58~69점", base_x + 346, base_y + 42),
        ("#a84f3f", "우선 점검: 접근성 점수와 지원수요 함께 검토", base_x + 690, base_y + 42),
    ]
    for color, text, x, y in items:
        draw.ellipse((x, y + 2, x + 20, y + 22), fill=color)
        draw.text((x + 28, y - 1), text, font=load_font(20, True), fill="#132635")

    draw.text(
        (base_x, base_y + 75),
        "공공데이터 기반 대표 생활권 10개 동 산출값입니다. 성남 전체 행정동 전수 점수가 아니라 대표 생활권 비교 지도입니다.",
        font=load_font(16),
        fill="#586569",
    )

    canvas.convert("RGB").save(OUTPUT, quality=96)
    print(OUTPUT)


if __name__ == "__main__":
    main()
