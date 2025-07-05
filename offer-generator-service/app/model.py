import torch
import torch.nn as nn
import math

class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=120):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len).unsqueeze(1).float()
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:,0::2] = torch.sin(position * div_term)
        pe[:,1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)
        self.register_buffer('pe', pe)

    def forward(self, x):
        return x + self.pe[:, :x.size(1), :]

class TransformerModel(nn.Module):
    def __init__(self, input_vocab_size, target_vocab_size,
                 d_model=512, nhead=8, num_layers=6, dim_ff=1024, dropout=0.2):
        super().__init__()
        self.d_model = d_model
        self.embedding_src = nn.Embedding(input_vocab_size, d_model, padding_idx=0)
        self.embedding_tgt = nn.Embedding(target_vocab_size, d_model, padding_idx=0)
        self.dropout = nn.Dropout(dropout)
        self.pos_encoder = PositionalEncoding(d_model)

        encoder_layer = nn.TransformerEncoderLayer(d_model, nhead, dim_ff, dropout)
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers)

        decoder_layer = nn.TransformerDecoderLayer(d_model, nhead, dim_ff, dropout)
        self.decoder = nn.TransformerDecoder(decoder_layer, num_layers)

        self.fc_out = nn.Linear(d_model, target_vocab_size)

    def forward(self, src, tgt):
        src_mask = (src == 0).to(src.device)
        tgt_mask = torch.triu(torch.ones(tgt.size(1), tgt.size(1), device=tgt.device), diagonal=1).bool()

        src_emb = self.dropout(self.pos_encoder(self.embedding_src(src) * math.sqrt(self.d_model))).permute(1, 0, 2)
        tgt_emb = self.dropout(self.pos_encoder(self.embedding_tgt(tgt) * math.sqrt(self.d_model))).permute(1, 0, 2)

        memory = self.encoder(src_emb, src_key_padding_mask=src_mask)
        output = self.decoder(tgt_emb, memory, tgt_mask=tgt_mask, tgt_key_padding_mask=(tgt == 0), memory_key_padding_mask=src_mask)
        return self.fc_out(output.permute(1, 0, 2))
