
export interface Question {
  paragraph: string;
  blanks: Array<BlankItem>
  dragWords: Array<DragWordItem>
}

export type BlankItem = {
  id: number,
  position: string
  correctAnswer: string
  type: string
}
export type DragWordItem = {
  id: number
  word: string
  color: string
}

export type AnswersInput = {
  [key: string]: {
    answer: string,
    dragItem?: DragWordItem,
    isCorrect?: boolean
  }
}

export type Answers = Array<DragWordItem>