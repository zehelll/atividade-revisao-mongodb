use('suporte');
print('COUNT_CHAMADOS=' + db.chamados.countDocuments());
print('COUNT_VALIDADOS=' + db.chamados_validados.countDocuments());
printjson(db.chamados.find({ titulo: 'Monitor sem imagem' }).toArray());
