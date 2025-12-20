const splitChineseWords = (text) => {
    const segmenter = new Intl.Segmenter("zh", { granularity: "word" });
    if (!text){
        return []
    }
    return [...segmenter.segment(text)]
        .filter(seg => seg.isWordLike)
        .map(seg => seg.segment);
    };

export { splitChineseWords };