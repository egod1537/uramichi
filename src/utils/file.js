export const convertFileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader()

    fileReader.onload = () => {
      if (typeof fileReader.result === 'string') {
        resolve(fileReader.result)
        return
      }
      reject(new Error('파일 변환 결과가 문자열이 아닙니다.'))
    }

    fileReader.onerror = () => {
      reject(new Error('파일을 읽는 중 오류가 발생했습니다.'))
    }

    fileReader.readAsDataURL(file)
  })
