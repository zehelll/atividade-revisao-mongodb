use('suporte');

db.chamados.drop();
db.chamados_validados.drop();

print('--- PASSO 6: inserir primeiro chamado ---');
db.chamados.insertOne({
  titulo: 'Monitor sem imagem',
  categoria: 'equipamento',
  prioridade: 'alta',
  status: 'aberto',
  solicitante: {
    nome: 'Ana',
    setor: 'Financeiro'
  },
  marcadores: ['monitor', 'hardware'],
  detalhes: {
    patrimonio: 'PAT-2048',
    localizacao: 'Sala 12'
  },
  historico: [
    {
      status: 'aberto',
      instante: new Date(),
      observacao: 'Chamado registrado'
    }
  ],
  criadoEm: new Date()
});

print('--- PASSO 7: inserir documentos diferentes ---');
db.chamados.insertMany([
  {
    titulo: 'Erro ao abrir sistema acadêmico',
    categoria: 'software',
    prioridade: 'media',
    status: 'em_atendimento',
    solicitante: {
      nome: 'Bruno',
      setor: 'Secretaria'
    },
    marcadores: ['sistema', 'navegador'],
    detalhes: {
      sistema: 'Portal Acadêmico',
      versao: '2026.3',
      navegador: 'Firefox'
    },
    historico: [
      {
        status: 'aberto',
        instante: new Date(),
        observacao: 'Chamado registrado'
      },
      {
        status: 'em_atendimento',
        instante: new Date(),
        observacao: 'Análise iniciada'
      }
    ],
    criadoEm: new Date()
  },
  {
    titulo: 'Solicitação de acesso ao relatório',
    categoria: 'acesso',
    prioridade: 'baixa',
    status: 'aberto',
    solicitante: {
      nome: 'Carla',
      setor: 'Compras'
    },
    marcadores: ['permissao', 'relatorio'],
    detalhes: {
      recurso: 'Relatório de fornecedores',
      perfilSolicitado: 'leitura'
    },
    historico: [
      {
        status: 'aberto',
        instante: new Date(),
        observacao: 'Aguardando autorização'
      }
    ],
    criadoEm: new Date()
  },
  {
    titulo: 'Teclado com defeito',
    categoria: 'equipamento',
    prioridade: 'media',
    status: 'fechado',
    solicitante: {
      nome: 'Diego',
      setor: 'Biblioteca'
    },
    marcadores: ['hardware'],
    detalhes: {
      patrimonio: 'PAT-3100'
    },
    historico: [
      {
        status: 'fechado',
        instante: new Date(),
        observacao: 'Equipamento substituído'
      }
    ],
    criadoEm: new Date()
  }
]);

print('--- PASSO 8: visualizar documentos e contar ---');
printjson(db.chamados.find().toArray());
print('COUNT_DOCUMENTS = ' + db.chamados.countDocuments());

print('--- PASSO 9: filtros ---');
printjson(db.chamados.find({ status: 'aberto' }).toArray());
printjson(db.chamados.find({ status: 'aberto', prioridade: 'alta' }).toArray());
printjson(db.chamados.find({ prioridade: { $in: ['alta', 'media'] } }).toArray());
printjson(db.chamados.find({ 'solicitante.setor': 'Financeiro' }).toArray());
printjson(db.chamados.find({ marcadores: 'hardware' }).toArray());

print('--- PASSO 10: projeção, ordenação e limite ---');
printjson(db.chamados
  .find(
    { status: 'aberto' },
    { _id: 0, titulo: 1, categoria: 1, prioridade: 1 }
  )
  .sort({ prioridade: 1 })
  .limit(10)
  .toArray());

print('--- PASSO 11: atualizar um chamado ---');
db.chamados.updateOne(
  {
    titulo: 'Monitor sem imagem',
    status: 'aberto'
  },
  {
    $set: {
      status: 'em_atendimento',
      prioridade: 'media'
    },
    $addToSet: {
      marcadores: 'triagem'
    },
    $push: {
      historico: {
        status: 'em_atendimento',
        instante: new Date(),
        observacao: 'Técnico responsável definido'
      }
    }
  }
);
printjson(db.chamados.findOne({ titulo: 'Monitor sem imagem' }));

print('--- PASSO 12: remover registro temporário ---');
db.chamados.insertOne({
  titulo: 'Registro temporário',
  categoria: 'teste',
  prioridade: 'baixa',
  status: 'aberto',
  solicitante: {
    nome: 'Laboratório',
    setor: 'Teste'
  },
  marcadores: [],
  detalhes: {},
  historico: [],
  criadoEm: new Date()
});
printjson(db.chamados.find({ titulo: 'Registro temporário' }).toArray());
db.chamados.deleteOne({ titulo: 'Registro temporário' });
print('TEMPORARIO_REMOVIDO = ' + db.chamados.countDocuments({ titulo: 'Registro temporário' }));

print('--- PASSO 13: criar índice e explicar ---');
db.chamados.createIndex({ status: 1, categoria: 1 });
printjson(db.chamados.getIndexes());
printjson(db.chamados.find({ status: 'aberto', categoria: 'acesso' }).explain('executionStats'));

print('--- PASSO 14: agregação por categoria ---');
printjson(db.chamados.aggregate([
  { $group: { _id: '$categoria', quantidade: { $sum: 1 } } },
  { $sort: { quantidade: -1 } }
]).toArray());
printjson(db.chamados.aggregate([
  { $match: { status: { $ne: 'fechado' } } },
  { $group: { _id: '$categoria', quantidade: { $sum: 1 } } }
]).toArray());

print('--- PASSO 15: criar coleção validada ---');
db.createCollection('chamados_validados', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['titulo', 'categoria', 'prioridade', 'status', 'solicitante', 'criadoEm'],
      properties: {
        titulo: {
          bsonType: 'string',
          minLength: 5,
          maxLength: 150
        },
        categoria: {
          enum: ['equipamento', 'software', 'acesso']
        },
        prioridade: {
          enum: ['baixa', 'media', 'alta']
        },
        status: {
          enum: ['aberto', 'em_atendimento', 'fechado']
        },
        solicitante: {
          bsonType: 'object',
          required: ['nome', 'setor']
        },
        marcadores: {
          bsonType: 'array'
        },
        criadoEm: {
          bsonType: 'date'
        }
      }
    }
  },
  validationAction: 'error'
});

print('--- PASSO 16: testar validação ---');
try {
  db.chamados_validados.insertOne({
    titulo: 'Oi',
    categoria: 'categoria_inexistente',
    prioridade: 'urgente'
  });
  print('INVALID_INSERT_ACCEPTED');
} catch (e) {
  print('INVALID_INSERT_REJECTED: ' + (e.errmsg || e.message));
}

db.chamados_validados.insertOne({
  titulo: 'Instalação de editor de texto',
  categoria: 'software',
  prioridade: 'baixa',
  status: 'aberto',
  solicitante: {
    nome: 'Elisa',
    setor: 'Comunicação'
  },
  marcadores: ['instalacao'],
  criadoEm: new Date()
});
printjson(db.chamados_validados.find().toArray());

print('--- FIM DO SCRIPT ---');
