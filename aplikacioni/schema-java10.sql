-- Java 10 · Dy ekrane, një gjendje
-- Ekzekuto pas schema-java05.sql (dhe java09) vetëm në databazën e laboratorit.
-- Shton tabelën e kërkesave dhe funksionin e pranimit; nuk fshin të dhëna.

CREATE TABLE IF NOT EXISTS kerkesat (
  id BIGSERIAL PRIMARY KEY,
  udhetim_id TEXT NOT NULL REFERENCES udhetimet(id) ON DELETE CASCADE,
  udhetar_id TEXT NOT NULL REFERENCES profilet(github_id) ON DELETE CASCADE,
  statusi TEXT NOT NULL DEFAULT 'ne_pritje'
    CHECK (statusi IN ('ne_pritje', 'pranuar')),
  krijuar_me TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ndryshuar_me TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Një udhëtar ka vetëm një kërkesë për të njëjtin udhëtim.
  CONSTRAINT kerkesat_udhetimi_udhetari_unike UNIQUE (udhetim_id, udhetar_id)
);

-- Vendet nuk bëhen kurrë negative, edhe nëse dikush e anashkalon aplikacionin.
DO $$ BEGIN
  ALTER TABLE udhetimet ADD CONSTRAINT udhetimet_vende_jo_negative CHECK (vende >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Pranimi: statusi dhe vendet ndryshojnë së bashku në një transaksion.
-- Rreshti i udhëtimit bllokohet (FOR UPDATE), prandaj dy pranime të njëkohshme
-- radhiten. Pranimi i përsëritur i së njëjtës kërkesë nuk e ul numrin përsëri.
-- Kthen: 'pranuar' | 'tashme_pranuar' | 'pa_vende' | 'ndaluar' | 'nuk_u_gjet'
CREATE OR REPLACE FUNCTION prano_kerkesen(p_kerkese_id BIGINT, p_shofer_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_udhetim_id TEXT;
  v_shofer_id TEXT;
  v_vende INT;
  v_statusi TEXT;
BEGIN
  SELECT udhetim_id INTO v_udhetim_id FROM kerkesat WHERE id = p_kerkese_id;
  IF NOT FOUND THEN RETURN 'nuk_u_gjet'; END IF;

  SELECT shofer_id, vende INTO v_shofer_id, v_vende
  FROM udhetimet WHERE id = v_udhetim_id FOR UPDATE;
  IF v_shofer_id IS DISTINCT FROM p_shofer_id THEN RETURN 'ndaluar'; END IF;

  SELECT statusi INTO v_statusi FROM kerkesat WHERE id = p_kerkese_id FOR UPDATE;
  IF v_statusi = 'pranuar' THEN RETURN 'tashme_pranuar'; END IF;
  IF v_vende <= 0 THEN RETURN 'pa_vende'; END IF;

  UPDATE udhetimet SET vende = vende - 1 WHERE id = v_udhetim_id;
  UPDATE kerkesat SET statusi = 'pranuar', ndryshuar_me = NOW()
  WHERE id = p_kerkese_id;
  RETURN 'pranuar';
END;
$$;

-- Të dhëna prove (opsionale). Zëvendëso <ID_GITHUB_I_SHOFERIT> me ID-në tënde
-- nga /panel (llogaria me rol 'shofer'), hiq komentet dhe ekzekuto.
-- INSERT INTO udhetimet (id, nisja, destinacioni, ora, vendtakimi, vende, shofer_id)
-- VALUES ('10', 'Ferizaj', 'AAB', '08:15', 'Te sheshi', 2, '<ID_GITHUB_I_SHOFERIT>'),
--        ('11', 'Ferizaj', 'AAB', '09:15', 'Te sheshi', 2, '<ID_GITHUB_I_SHOFERIT>')
-- ON CONFLICT (id) DO NOTHING;

SELECT id, vende, shofer_id FROM udhetimet ORDER BY id;
