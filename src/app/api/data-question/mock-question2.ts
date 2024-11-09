const question = {
  question: {
    paragraph:
      `<div class='p-2'>The sky is [_input] and the grass is [_input]. <span>qweqwe 123 123 12</span> You should drag the word <span style='color: red;'>green</span> to the correct blank. <table class="border-collapse border border-slate-400 mt-10"> <tr class="border border-black"> <th class='border border-solid border-slate-600 p-2'>[_input]</th> <th class='border border-solid border-slate-600 p-2'>Contact</th> <th class='border border-solid border-slate-600 p-2'>Country</th> </tr> </table> </div>`,
    blanks: [
      { id: 1, position: "first", correctAnswer: "blue", type: "input", },
      { id: 2, position: "second", correctAnswer: "green", type: "drag", },
      { id: 3, position: "3rd", correctAnswer: "red", type: "drag", },
    ],
    dragWords: [
      { word: "blue", color: "default", id: 1, },
      { word: "green", color: "red", id: 2, },
      { word: "yellow", color: "default", id: 3, },
      { word: "red", color: "default", id: 4, },
      { word: "black", color: "black", id: 5, },
    ],
  }
}

export default question