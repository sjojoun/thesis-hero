/**
 * 生成测试论文 .docx — 包含完整学术结构
 */
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, SectionType, Header, Footer, PageNumber } from 'docx';
import { writeFileSync } from 'fs';

const doc = new Document({
  styles: {
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 44, bold: true, font: '黑体' },
        paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 120 } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: '黑体' },
        paragraph: { spacing: { before: 200, after: 100 } } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: '黑体' },
        paragraph: { spacing: { before: 160, after: 80 } } },
    ],
  },
  sections: [{
    properties: {},
    headers: { default: new Header({
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '测试论文 - 基于深度学习的自然语言处理研究', font: '宋体', size: 18, italics: true, color: '999999' })] })]
    })},
    footers: { default: new Footer({
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: '宋体', size: 18 })] })]
    })},
    children: [

      // ===== 标题 =====
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [
        new TextRun({ text: '基于深度学习的自然语言处理在智能问答系统中的应用研究', bold: true, size: 44, font: '黑体' })
      ]}),

      // ===== 摘要 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '摘要', bold: true, size: 44, font: '黑体' })] }),
      new Paragraph({ spacing: { line: 360 }, indent: { firstLine: 480 }, children: [
        new TextRun({ text: '随着人工智能技术的快速发展，自然语言处理（NLP）已成为计算机科学领域的研究热点。本文提出了一种基于Transformer架构的改进型问答系统，通过引入注意力机制和预训练语言模型，显著提升了问答的准确率和响应速度。实验结果表明，该方法在SQuAD 2.0数据集上达到了92.3%的F1分数，相比传统方法提升了约8个百分点。本文还探讨了模型压缩和知识蒸馏技术在移动端部署中的可行性。', size: 24, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),

      // ===== 第一章 绪论 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '第一章 绪论', bold: true, size: 44, font: '黑体' })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '1.1 研究背景', bold: true, size: 36, font: '黑体' })] }),
      new Paragraph({ spacing: { line: 360 }, indent: { firstLine: 480 }, children: [
        new TextRun({ text: '自然语言处理是人工智能领域的重要分支，旨在使计算机能够理解、生成和处理人类语言。近年来，深度学习技术的突破性进展为NLP研究带来了新的范式。特别是2018年BERT模型的提出，标志着预训练-微调范式在NLP领域的正式确立。随后，GPT系列、T5、LLaMA等大规模语言模型的出现，进一步推动了NLP技术向通用人工智能方向的发展。', size: 24, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '1.2 研究意义', bold: true, size: 36, font: '黑体' })] }),
      new Paragraph({ spacing: { line: 360 }, indent: { firstLine: 480 }, children: [
        new TextRun({ text: '智能问答系统作为NLP技术的典型应用场景，在客服、教育、医疗等领域具有广泛的应用前景。然而，现有问答系统在理解复杂语义、处理多轮对话、融合外部知识等方面仍面临诸多挑战。本研究通过改进模型架构和训练策略，旨在解决上述问题，为构建更加智能和可靠的问答系统提供理论依据和技术支撑。', size: 24, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),

      // ===== 第二章 相关工作 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '第二章 相关工作', bold: true, size: 44, font: '黑体' })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '2.1 传统问答系统', bold: true, size: 36, font: '黑体' })] }),
      new Paragraph({ spacing: { line: 360 }, indent: { firstLine: 480 }, children: [
        new TextRun({ text: '早期的问答系统主要基于规则和模板匹配的方法，Eliza、Baseball等系统开创了问答技术的先河。基于信息检索的问答系统通过从大规模文档集合中检索相关段落并提取答案，代表性工作包括IBM的DeepQA系统，该系统在2011年Jeopardy!比赛中击败人类冠军。', size: 24, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '2.2 基于深度学习的问答模型', bold: true, size: 36, font: '黑体' })] }),
      new Paragraph({ spacing: { line: 360 }, indent: { firstLine: 480 }, children: [
        new TextRun({ text: '深度学习技术为问答系统带来了革命性的变化。BiDAF（Bidirectional Attention Flow）模型通过双向注意力流机制，实现了问题和段落之间的多层次交互理解。QANet模型则完全基于卷积和自注意力机制，大幅提升了训练和推理速度。BERT等预训练模型通过在阅读理解任务上微调，在多个基准数据集上取得了当时最好的结果。', size: 24, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),

      // ===== 第三章 模型设计 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '第三章 模型设计与实现', bold: true, size: 44, font: '黑体' })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '3.1 整体架构', bold: true, size: 36, font: '黑体' })] }),
      new Paragraph({ spacing: { line: 360 }, indent: { firstLine: 480 }, children: [
        new TextRun({ text: '本文提出的改进型问答系统采用编码器-解码器架构，主要由三个模块组成：文本编码模块、注意力交互模块和答案预测模块。文本编码模块使用预训练的RoBERTa模型对问题和上下文段落进行编码，生成上下文感知的词向量表示。注意力交互模块通过多头注意力机制和双向注意力流，实现问题与段落之间的深度语义交互。答案预测模块包含两个并行输出层，分别用于预测答案的起始位置和结束位置。', size: 24, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: '3.1.1 文本编码模块', bold: true, size: 32, font: '黑体' })] }),
      new Paragraph({ spacing: { line: 360 }, indent: { firstLine: 480 }, children: [
        new TextRun({ text: '编码器采用12层Transformer编码器结构，隐藏层维度为768，注意力头数为12。输入序列通过字节对编码（BPE）分词后，添加特殊标记[CLS]和[SEP]分别标识序列起始和分隔符。位置编码采用可学习的绝对位置编码，最大支持512个token的输入长度。', size: 24, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: '3.1.2 注意力交互模块', bold: true, size: 32, font: '黑体' })] }),
      new Paragraph({ spacing: { line: 360 }, indent: { firstLine: 480 }, children: [
        new TextRun({ text: '注意力交互模块采用双向注意力流（Bidirectional Attention Flow, BiDAF）的设计思想，分别计算Context-to-Query注意力和Query-to-Context注意力。两种注意力向量与原始编码向量拼接后，输入到双向LSTM网络中进行建模，以捕捉长距离依赖关系。', size: 24, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),

      // ===== 第四章 实验 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '第四章 实验与结果分析', bold: true, size: 44, font: '黑体' })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '4.1 实验设置', bold: true, size: 36, font: '黑体' })] }),
      new Paragraph({ spacing: { line: 360 }, indent: { firstLine: 480 }, children: [
        new TextRun({ text: '实验在配备NVIDIA Tesla A100 GPU（40GB显存）的服务器上进行。模型训练采用AdamW优化器，初始学习率为3e-5，批次大小为16，共训练3个轮次。验证集上采用早停策略，如果F1分数连续3个评估周期没有提升则停止训练。', size: 24, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '4.2 实验结果', bold: true, size: 36, font: '黑体' })] }),
      new Paragraph({ spacing: { line: 360 }, indent: { firstLine: 480 }, children: [
        new TextRun({ text: '表4.1展示了本文方法与其他主流问答模型在SQuAD 2.0数据集上的对比结果。本文提出的方法在EM（Exact Match）和F1两个指标上均取得了最佳性能，分别为87.6%和92.3%。特别是在需要推理的问题类型上，本文方法的提升更为显著，验证了注意力交互模块设计的有效性。', size: 24, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),

      // ===== 第五章 结论 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '第五章 结论与展望', bold: true, size: 44, font: '黑体' })] }),
      new Paragraph({ spacing: { line: 360 }, indent: { firstLine: 480 }, children: [
        new TextRun({ text: '本文针对智能问答系统中存在的问题，提出了一种基于改进Transformer架构的问答模型。通过引入双向注意力流机制和预训练语言模型，在SQuAD 2.0数据集上取得了优异的结果。未来的研究方向包括：探索更大规模预训练模型的应用效果、研究模型压缩技术在边缘设备上的部署方案、以及将外部知识库与问答系统进行深度融合。', size: 24, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),

      // ===== 致谢 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '致谢', bold: true, size: 44, font: '黑体' })] }),
      new Paragraph({ spacing: { line: 360 }, indent: { firstLine: 480 }, children: [
        new TextRun({ text: '本研究得到了国家自然科学基金项目（编号：62076123）的资助。感谢实验室全体成员在实验过程中给予的帮助和建议。特别感谢张老师在整个研究过程中的悉心指导。', size: 24, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),

      // ===== 参考文献 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '参考文献', bold: true, size: 44, font: '黑体' })] }),
      new Paragraph({ spacing: { line: 360 }, children: [
        new TextRun({ text: '[1] Devlin J, Chang M W, Lee K, et al. BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding[C]. NAACL-HLT, 2019: 4171-4186.', size: 21, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),
      new Paragraph({ spacing: { line: 360 }, children: [
        new TextRun({ text: '[2] Liu Y, Ott M, Goyal N, et al. RoBERTa: A Robustly Optimized BERT Pretraining Approach[J]. arXiv preprint arXiv:1907.11692, 2019.', size: 21, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),
      new Paragraph({ spacing: { line: 360 }, children: [
        new TextRun({ text: '[3] Vaswani A, Shazeer N, Parmar N, et al. Attention Is All You Need[C]. NeurIPS, 2017: 5998-6008.', size: 21, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),
      new Paragraph({ spacing: { line: 360 }, children: [
        new TextRun({ text: '[4] Rajpurkar P, Jia R, Liang P. Know What You Don\'t Know: Unanswerable Questions for SQuAD[C]. ACL, 2018: 784-789.', size: 21, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),
      new Paragraph({ spacing: { line: 360 }, children: [
        new TextRun({ text: '[5] Clark K, Luong M T, Le Q V, et al. ELECTRA: Pre-training Text Encoders as Discriminators Rather Than Generators[C]. ICLR, 2020.', size: 21, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),
      new Paragraph({ spacing: { line: 360 }, children: [
        new TextRun({ text: '[6] Seo M, Kembhavi A, Farhadi A, et al. Bidirectional Attention Flow for Machine Comprehension[C]. ICLR, 2017.', size: 21, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),
      new Paragraph({ spacing: { line: 360 }, children: [
        new TextRun({ text: '[7] Yu A W, Dohan D, Luong M T, et al. QANet: Combining Local Convolution with Global Self-Attention for Reading Comprehension[C]. ICLR, 2018.', size: 21, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),
      new Paragraph({ spacing: { line: 360 }, children: [
        new TextRun({ text: '[8] Lan Z, Chen M, Goodman S, et al. ALBERT: A Lite BERT for Self-supervised Learning of Language Representations[C]. ICLR, 2020.', size: 21, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),
      new Paragraph({ spacing: { line: 360 }, children: [
        new TextRun({ text: '[9] Brown T B, Mann B, Ryder N, et al. Language Models are Few-Shot Learners[C]. NeurIPS, 2020: 1877-1901.', size: 21, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),
      new Paragraph({ spacing: { line: 360 }, children: [
        new TextRun({ text: '[10] Hinton G, Vinyals O, Dean J. Distilling the Knowledge in a Neural Network[J]. arXiv preprint arXiv:1503.02531, 2015.', size: 21, font: { eastAsia: '宋体', ascii: 'Times New Roman' } })
      ]}),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(new URL('./test-paper.docx', import.meta.url).pathname, buffer);
console.log('✅ 测试论文已生成: test-paper.docx');
console.log(`   文件大小: ${(buffer.length / 1024).toFixed(1)} KB`);
console.log('   内容: 5章、2节/章、2条三级标题、摘要、致谢、10篇参考文献');
