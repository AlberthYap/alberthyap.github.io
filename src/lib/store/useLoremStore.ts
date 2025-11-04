import { create } from "zustand";

type GenerateType = "paragraphs" | "words" | "sentences" | "list";

interface LoremState {
  // Settings
  generateType: GenerateType;
  count: number;
  startWithLorem: boolean;

  // Output
  outputText: string;

  // Actions
  setGenerateType: (type: GenerateType) => void;
  setCount: (count: number) => void;
  toggleStartWithLorem: () => void;
  setOutputText: (text: string) => void;
  generate: () => void;
  clearAll: () => void;
}

// Lorem ipsum words pool
const WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum",
];

const LOREM_START = "Lorem ipsum dolor sit amet, consectetur adipiscing elit";

// Helper functions
const getRandomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];

const generateWords = (count: number, startWithLorem: boolean): string => {
  const words: string[] = [];

  if (startWithLorem) {
    words.push(
      ...LOREM_START.toLowerCase()
        .split(/[,\s]+/)
        .filter(Boolean)
    );
    count = Math.max(0, count - words.length);
  }

  for (let i = 0; i < count; i++) {
    words.push(getRandomWord());
  }

  return words.join(" ");
};

const generateSentence = (minWords = 5, maxWords = 15): string => {
  const wordCount =
    Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  const words = generateWords(wordCount, false).split(" ");
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(" ") + ".";
};

const generateParagraph = (
  minSentences = 4,
  maxSentences = 8,
  startWithLorem = false
): string => {
  const sentenceCount =
    Math.floor(Math.random() * (maxSentences - minSentences + 1)) +
    minSentences;
  const sentences: string[] = [];

  if (startWithLorem && sentences.length === 0) {
    sentences.push(LOREM_START + ".");
  }

  for (let i = startWithLorem ? 1 : 0; i < sentenceCount; i++) {
    sentences.push(generateSentence());
  }

  return sentences.join(" ");
};

export const useLoremStore = create<LoremState>((set, get) => ({
  // Initial state
  generateType: "paragraphs",
  count: 3,
  startWithLorem: true,
  outputText: "",

  // Setters
  setGenerateType: (type) => set({ generateType: type }),
  setCount: (count) => set({ count: Math.max(1, Math.min(count, 100)) }),
  toggleStartWithLorem: () =>
    set((state) => ({ startWithLorem: !state.startWithLorem })),
  setOutputText: (text) => set({ outputText: text }),

  // Clear
  clearAll: () => set({ outputText: "" }),

  // Generate logic
  generate: () => {
    const { generateType, count, startWithLorem } = get();
    let result = "";

    switch (generateType) {
      case "paragraphs":
        const paragraphs: string[] = [];
        for (let i = 0; i < count; i++) {
          paragraphs.push(generateParagraph(4, 8, i === 0 && startWithLorem));
        }
        result = paragraphs.join("\n\n");
        break;

      case "words":
        result = generateWords(count, startWithLorem);
        break;

      case "sentences":
        const sentences: string[] = [];
        if (startWithLorem) {
          sentences.push(LOREM_START + ".");
        }
        for (let i = startWithLorem ? 1 : 0; i < count; i++) {
          sentences.push(generateSentence());
        }
        result = sentences.join(" ");
        break;

      case "list":
        const listItems: string[] = [];
        for (let i = 0; i < count; i++) {
          const item =
            i === 0 && startWithLorem
              ? LOREM_START
              : generateSentence(3, 8).replace(/\.$/, "");
          listItems.push(`${i + 1}. ${item}`);
        }
        result = listItems.join("\n");
        break;
    }

    set({ outputText: result });
  },
}));
