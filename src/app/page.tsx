"use client"
import { useState, useEffect, useRef, FormEvent } from 'react';
import ReactHtmlParser from 'react-html-parser';
import _ from 'lodash'
import { motion, PanInfo } from "framer-motion/dist/framer-motion"; // @ts-ignore
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast"
import type { Question, AnswersInput, Answers } from './types'

function containsPoint(element: any, x: number, y: number) {
  const rect = element.getBoundingClientRect();
  return rect.top <= y && y <= rect.bottom && rect.left <= x && x <= rect.right;
}

export default function Home() {
  const { toast } = useToast()
  const [question, setQuestion] = useState<Question>() // question get from "app/api/data-question"
  const [answersInput, setAnswersInput] = useState<AnswersInput>({}) // answers user input
  const [answers, setAnswers] = useState<Answers>([]) // answer in questios
  const [hoveredSlot, setHoveredSlot] = useState<string | undefined>("") // current drag item hover
  const [isDragging, setDragging] = useState(false) // has drag
  const [resultSubmit, setResultSubmit] = useState<boolean | undefined>()
  const containerRef = useRef<any>([]) // ref to get postion of DOM to check is hover or not

  useEffect(() => {
    const getQuestion = async () => {
      const result = await fetch("/api/data-question")
      const { question: questionTemp }: { question: Question } = await result.json()
      const answersInut: AnswersInput = {}
      questionTemp.blanks.forEach((blank) => {
        answersInut[blank.id] = {
          answer: "",
          isCorrect: false
        }
      })
      setQuestion(questionTemp)
      setAnswers(questionTemp.dragWords)
      setAnswersInput(answersInut)
    }

    getQuestion()
  }, [])

  if (!question) return null

  // handle when word end drag
  const handleDragEnd = (idx: number) => {
    const answersClone = _.cloneDeep(answers)
    setDragging(false);
  
    if (hoveredSlot && !answersInput[hoveredSlot]?.answer ) {
      answersInput[hoveredSlot] = { answer: answersClone[idx].word }
      answersClone.splice(idx, 1)
      setAnswersInput(answersInput)
      setAnswers(answersClone)
    }
  }

  // handle when word drag
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    let hoverItem: undefined | string = undefined
    containerRef.current.forEach(
      (ref: any) => {
        if (containsPoint(ref.inputRef, info.point.x, info.point.y)) {
          setHoveredSlot(ref.id)
          hoverItem = ref.id
        }
      }
    );
    setHoveredSlot(hoverItem)
    setResultSubmit(undefined)
  }

  // handle when word is start drag
  const handleDragStart = () => {
    setDragging(true)
  }

  // handle answer when user input to answer type input
  const handleSetAnswerInput = (e: FormEvent<HTMLDivElement>, idx: number) => {
    const answerInputClone = _.cloneDeep(answersInput)
    answerInputClone[idx] = { answer: _.get(e.target, 'textContent', "")}
    setAnswersInput(answerInputClone)
    setResultSubmit(undefined)
  }

  // render all words drag
  const renderAnswers = () => {
    return answers.map((item, idx) => {
      const color = item.color === 'default' ? {} : { color: item.color }
      return (
        <div className="relative" key={item.id}>
          <motion.div
            className="border-solid border-[1px] px-[15px] py-[5px]"
            style={{...color}}
            layoutId={`${item.id}`}
            drag={true}
            dragElastic={true}
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            animate={{
              scale: 1,
              boxShadow: "2px 2px 1px rgba(0, 0, 0, 0.2)",
              cursor: "grab",
            }}
            whileDrag={{
              cursor: "grabbing",
            }}
            onDragStart={() => {
              handleDragStart();
            }}
            onDrag={(event, info) => {
              handleDrag(event, info);
            }}
            onDragEnd={() => {
              handleDragEnd(idx)
            }}
          >{item.word}</motion.div>
        </div>
      )
    })
  }

  const blanks = _.get(question, 'blanks')
  const parts = question?.paragraph.split(/(\[_input\])/); // split string to array to replace "[_input]" to input or contain drag item
  let indexInput = -1

  const checkAnswers = () => {
    const { blanks } = question
    const answersInputClone = _.cloneDeep(answersInput)
    let isCorrectAll = true
    blanks.forEach(blank => {
      const { id } = blank
      const isCorrect = answersInputClone[id].answer === blank.correctAnswer
      answersInputClone[id].isCorrect = isCorrect
      if (!isCorrect) {
        isCorrectAll = false
      }
    })

    const description = isCorrectAll ? 'The answer is correct' : 'The answer is incorrect'
    const variant = isCorrectAll ? "default" : "destructive"
    toast({
      variant,
      title: "Result of the answer",
      description,
      
    })
    setResultSubmit(isCorrectAll)
    setAnswersInput(answersInputClone)
  }

  return (
    <div className='flex justify-center items-center min-h-screen'>
      <div className='max-w-[900px] p-4'>
        <div className='flex gap-4 mb-5'>
          {renderAnswers()}
        </div>
        <div className='flex items-center letter [&>span]:m-1 flex-wrap'>
          {parts.map((part, index) => {
            if (part === '[_input]') {
              indexInput++
              const dataIdx = indexInput
              const itemAnswer = answersInput[blanks[dataIdx].id]
              const isIncorrect = !_.isNil(resultSubmit) && !itemAnswer?.isCorrect
              const key = `${part}-${index}`
              if (blanks[indexInput].type === "input") {
                return <div key={key} contentEditable={true} onInput={(e) => handleSetAnswerInput(e, blanks[dataIdx].id)} className={`inline-block min-w-12 h-7 border-b-[1px] outline-none font-bold py-1 mx-2 ${isIncorrect ? 'border-red-500' : ''}`} />
              }
              return (
                <motion.div
                  key={key}
                  animate={{
                    borderColor:
                      isDragging 
                        ? "green"
                        : "",
                  }}
                  className={`inline-block min-w-14 min-h-7 border-[1px] px-2 py-1 mx-2 ${isIncorrect ? 'border-red-500' : ''}`}
                  ref={(ref: HTMLDivElement) => { containerRef.current.push({ id: blanks[dataIdx].id, inputRef: ref })}}
                >
                  <div>
                    {itemAnswer?.answer}
                  </div>
                </motion.div>
              )
            }

            return ReactHtmlParser(part)
          })}
        </div>
        <div className='text-center mt-4'>
          <Button onClick={checkAnswers} className='min-w-[200px]'>Submit</Button>
        </div>
      </div>
    </div>
  )
}
