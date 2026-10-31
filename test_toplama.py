import unittest

def topla(a, b):
    return a + b

class TestToplama(unittest.TestCase):

    def test_pozitif_sayilar(self):
        self.assertEqual(topla(5, 3), 8)

    def test_negatif_sayilar(self):
        self.assertEqual(topla(-5, -3), -8)

    def test_sifir(self):
        self.assertEqual(topla(5, 0), 5)

if __name__ == "__main__":
    unittest.main()

