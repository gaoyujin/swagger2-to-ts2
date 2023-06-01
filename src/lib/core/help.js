import { program } from 'commander'

export const helpOptions = () => {
  program.option(
    '-stt2 -swagger2-to-ts2',
    '创建代码的起始命令【如： stt2 http://XXX/swagger-ui.html】'
  )

  program.option('-i -init', '创建默认的配置文件【swagger2ts.json】')

  program.on('--help', function () {
    console.log('')
    console.log('usage')
    console.log('   stt2 -v')
    console.log('   stt2 -version')
    console.log('   swagger2-to-ts2 -v')
    console.log('   swagger2-to-ts2 -version')
  })
}
